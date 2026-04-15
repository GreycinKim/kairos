"""Fetch scripture text for supported translations (ESV, LSB, NKJV via bolls.life; KJV via bible-api.com)."""

from __future__ import annotations

import html
import re
import urllib.parse
from collections import OrderedDict
from enum import Enum

import httpx
from fastapi import HTTPException

from app.schemas.scripture import ChapterTextResponse, ChapterVerseRow, VerseTextResponse

BIBLE_API = "https://bible-api.com/"
BOLLS = "https://bolls.life/get-text"

_TAG = re.compile(r"<[^>]+>")
_BR = re.compile(r"<br\s*/?>", re.IGNORECASE)

# In-process LRU-ish cache so repeat chapter/verse reads avoid round-trips (no private DB required).
# Fourth tuple field bumps when chapter shaping (e.g. LSB headings) changes so stale cache entries are not reused.
_CHAPTER_CACHE: OrderedDict[tuple[str, str, int, int], ChapterTextResponse] = OrderedDict()
_CHAPTER_CACHE_BUMP = 3
_VERSE_CACHE: OrderedDict[tuple[str, str, int, int, int], VerseTextResponse] = OrderedDict()
_CACHE_CAP = 500


def _chapter_cache_put(key: tuple[str, str, int, int], value: ChapterTextResponse) -> None:
    _CHAPTER_CACHE[key] = value
    _CHAPTER_CACHE.move_to_end(key)
    while len(_CHAPTER_CACHE) > _CACHE_CAP:
        _CHAPTER_CACHE.popitem(last=False)


def _verse_cache_put(key: tuple[str, str, int, int, int], value: VerseTextResponse) -> None:
    _VERSE_CACHE[key] = value
    _VERSE_CACHE.move_to_end(key)
    while len(_VERSE_CACHE) > _CACHE_CAP:
        _VERSE_CACHE.popitem(last=False)


def _cache_get_chapter(key: tuple[str, str, int, int]) -> ChapterTextResponse | None:
    if key not in _CHAPTER_CACHE:
        return None
    _CHAPTER_CACHE.move_to_end(key)
    return _CHAPTER_CACHE[key].model_copy(deep=True)


def _cache_get_verse(key: tuple[str, str, int, int, int]) -> VerseTextResponse | None:
    if key not in _VERSE_CACHE:
        return None
    _VERSE_CACHE.move_to_end(key)
    return _VERSE_CACHE[key].model_copy(deep=True)


def _strip_markup(s: str) -> str:
    """Drop HTML tags; treat <br> as a word break so headings are not glued to the next line."""
    t = html.unescape(s or "")
    t = _BR.sub(" ", t)
    t = _TAG.sub("", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


# bolls.life LSB embeds study section titles in the same string as the verse (e.g. "The Deity of Jesus Christ In the beginning…").
# We only split when the prefix looks like a printed section heading, then on a whitelist of verse-opening phrases (longest first).
_LSB_PROBE_LEN = 140
_LSB_VERSE_LEAD_FRAGMENTS: tuple[str, ...] = (
    "In the beginning",
    "In the world",
    "In the day",
    "In the year",
    "In the land",
    "In the time",
    "In the same",
    "In the field",
    "In the house",
    "In the city",
    "In the tent",
    "In the camp",
    "In the morning",
    "In the evening",
    "In the days",
    "In the midst",
    "In these",
    "In that",
    "In this",
    "In Him was",
    "In her ",
    "In his ",
    "In my ",
    "In your ",
    "In our ",
    "In their ",
    "And the Word became",
    "And this is the testimony",
    "And this is the witness",
    "And this is ",
    "There was ",
    "There is ",
    "There came ",
    "There are ",
    "He was in ",
    "He was not ",
    "He came ",
    "He said ",
    "He had ",
    "He has ",
    "He answered",
    "He confessed",
    "He first ",
    "He brought ",
    "He looked ",
    "For of ",
    "For the ",
    "For from ",
    "For God ",
    "For I ",
    "Then God said",
    "Then God ",
    "So God ",
    "On the next day",
    "On the next ",
    "even he who",
    "The next day",
    "The following day",
    "Again, the next",
    "John answered",
    "John bore",
    "Jesus answered",
    "Jesus turned",
    "Jesus saw",
    "Nathanael answered",
    "Philip found",
    "God made",
    "God blessed",
    "God called",
    "God created",
    "God placed",
    "God saw",
    "God said",
    "Blessed is ",
    "Sing to ",
    "The LORD ",
    "The Lord ",
    "When Jesus",
    "When they",
    "When Abram",
)

_LSB_INLINE_SPLIT_RE = re.compile(
    r"\s+("
    + "|".join(
        re.escape(f.rstrip())
        for f in sorted(set(_LSB_VERSE_LEAD_FRAGMENTS), key=lambda x: len(x.rstrip()), reverse=True)
    )
    # Next char is almost always whitespace before the rest of the verse (see "In the beginning God…").
    + r")(?=\s|$|[,;:\"'(\u201c\u2018\u2014\u2013])"
)


def _looks_like_lsb_section_heading(s: str, split_at: int) -> bool:
    head = s[:split_at].strip()
    if len(head) < 4 or len(head) > 120 or head.count(" ") >= 16:
        return False
    h = head.lower()
    if h.startswith("the ") or h.startswith("a ") or h.startswith("an "):
        return True
    if h.startswith("behold,"):
        return True
    if h == "creation":
        return True
    return h.startswith("and the word became flesh")


def _split_lsb_inline_section_title(raw: str) -> tuple[str, str | None]:
    s = raw.strip()
    if len(s) < 18:
        return raw, None
    probe = s[:_LSB_PROBE_LEN]
    m = _LSB_INLINE_SPLIT_RE.search(probe)
    if not m:
        return raw, None
    verse_start = m.start(1)
    if verse_start < 2:
        return raw, None
    if not _looks_like_lsb_section_heading(s, verse_start):
        return raw, None
    head = s[:verse_start].strip()
    body = s[verse_start:].strip()
    if len(head) < 4 or len(body) < 10:
        return raw, None
    lead = m.group(1)
    if not body.startswith(lead):
        return raw, None
    return body, head


# Protestant 66-book order (1 = Genesis … 66 = Revelation), matching bolls.life indices.
BOOK_ORDER: list[str] = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation",
]


class BibleTranslation(str, Enum):
    ESV = "ESV"
    LSB = "LSB"
    NKJV = "NKJV"
    KJV = "KJV"


def book_index(book: str) -> int:
    key = book.strip().lower()
    for i, name in enumerate(BOOK_ORDER, start=1):
        if name.lower() == key:
            return i
    raise HTTPException(status_code=400, detail=f"Unknown book: {book}")


async def fetch_chapter(translation: BibleTranslation, book: str, chapter: int) -> ChapterTextResponse:
    b = book.strip()
    ck = (translation.value, b.lower(), chapter, _CHAPTER_CACHE_BUMP)
    hit = _cache_get_chapter(ck)
    if hit is not None:
        return hit
    if translation == BibleTranslation.KJV:
        out = await _chapter_bible_api(b, chapter, translation_id="kjv")
    else:
        out = await _chapter_bolls(translation.value, b, chapter)
    _chapter_cache_put(ck, out)
    return out.model_copy(deep=True)


async def fetch_verse_text(
    translation: BibleTranslation,
    book: str,
    chapter: int,
    verse_start: int,
    verse_end: int,
) -> VerseTextResponse:
    b = book.strip()
    lo, hi = (verse_start, verse_end) if verse_start <= verse_end else (verse_end, verse_start)
    vk = (translation.value, b.lower(), chapter, lo, hi)
    vhit = _cache_get_verse(vk)
    if vhit is not None:
        return vhit
    if translation == BibleTranslation.KJV:
        out = await _verse_bible_api(b, chapter, verse_start, verse_end, translation_id="kjv")
    else:
        out = await _verse_bolls(translation.value, b, chapter, verse_start, verse_end)
    _verse_cache_put(vk, out)
    return out.model_copy(deep=True)


async def _chapter_bible_api(book: str, chapter: int, *, translation_id: str) -> ChapterTextResponse:
    ref = f"{book} {chapter}"
    path = urllib.parse.quote(ref, safe="")
    url = f"{BIBLE_API}{path}?translation={urllib.parse.quote(translation_id)}"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Bible API error: {e!s}") from e

    rows: list[ChapterVerseRow] = []
    raw_verses = data.get("verses")
    if isinstance(raw_verses, list):
        for v in raw_verses:
            if not isinstance(v, dict):
                continue
            vn = v.get("verse")
            if not isinstance(vn, int):
                continue
            t = _strip_markup(str(v.get("text") or ""))
            rows.append(ChapterVerseRow(verse=vn, text=t))
        rows.sort(key=lambda x: x.verse)

    reference = str(data.get("reference") or ref)
    trans = str(data.get("translation_name") or data.get("translation") or translation_id.upper())
    return ChapterTextResponse(
        reference=reference,
        translation=trans,
        book=book,
        chapter=chapter,
        verses=rows,
    )


async def _verse_bible_api(
    book: str,
    chapter: int,
    verse_start: int,
    verse_end: int,
    *,
    translation_id: str,
) -> VerseTextResponse:
    ref = f"{book} {chapter}:{verse_start}"
    if verse_end != verse_start:
        ref = f"{book} {chapter}:{verse_start}-{verse_end}"
    path = urllib.parse.quote(ref, safe="")
    url = f"{BIBLE_API}{path}?translation={urllib.parse.quote(translation_id)}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Bible API error: {e!s}") from e

    text = (data.get("text") or "").strip()
    if not text and data.get("verses"):
        text = " ".join(
            _strip_markup(str(v.get("text") or "")) for v in data["verses"] if isinstance(v, dict)
        ).strip()
    else:
        text = _strip_markup(text)
    reference = str(data.get("reference") or ref)
    trans = str(data.get("translation_name") or data.get("translation") or translation_id.upper())
    return VerseTextResponse(reference=reference, text=text, translation=trans)


async def _chapter_bolls(version_code: str, book: str, chapter: int) -> ChapterTextResponse:
    bid = book_index(book)
    url = f"{BOLLS}/{version_code}/{bid}/{chapter}/"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            payload = r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Bible text error: {e!s}") from e

    if not isinstance(payload, list):
        raise HTTPException(status_code=502, detail="Unexpected Bible API response")

    rows: list[ChapterVerseRow] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        vn = item.get("verse")
        if not isinstance(vn, int):
            continue
        t = _strip_markup(str(item.get("text") or ""))
        if version_code == "LSB":
            body, sec = _split_lsb_inline_section_title(t)
            rows.append(ChapterVerseRow(verse=vn, text=body, section_title=sec))
        else:
            rows.append(ChapterVerseRow(verse=vn, text=t))
    rows.sort(key=lambda x: x.verse)

    ref = f"{book} {chapter}"
    return ChapterTextResponse(
        reference=ref,
        translation=version_code,
        book=book,
        chapter=chapter,
        verses=rows,
    )


async def _verse_bolls(version_code: str, book: str, chapter: int, verse_start: int, verse_end: int) -> VerseTextResponse:
    ch = await _chapter_bolls(version_code, book, chapter)
    lo, hi = (verse_start, verse_end) if verse_start <= verse_end else (verse_end, verse_start)
    ordered = sorted(
        [row for row in ch.verses if lo <= row.verse <= hi],
        key=lambda r: r.verse,
    )
    text = " ".join(r.text for r in ordered).strip()
    ref = f"{book} {chapter}:{verse_start}"
    if verse_end != verse_start:
        ref = f"{book} {chapter}:{verse_start}-{verse_end}"
    return VerseTextResponse(reference=ref, text=text, translation=version_code)
