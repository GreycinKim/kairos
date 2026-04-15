"""Build Blue Letter Bible URLs for reader / word-study notes (no scraping)."""

# BLB path uses 3-letter book codes (lowercase).
BLB_BOOK: dict[str, str] = {
    "Genesis": "gen",
    "Exodus": "exo",
    "Leviticus": "lev",
    "Numbers": "num",
    "Deuteronomy": "deu",
    "Joshua": "jos",
    "Judges": "jdg",
    "Ruth": "rut",
    "1 Samuel": "1sa",
    "2 Samuel": "2sa",
    "1 Kings": "1ki",
    "2 Kings": "2ki",
    "1 Chronicles": "1ch",
    "2 Chronicles": "2ch",
    "Ezra": "ezr",
    "Nehemiah": "neh",
    "Esther": "est",
    "Job": "job",
    "Psalms": "psa",
    "Proverbs": "pro",
    "Ecclesiastes": "ecc",
    "Song of Solomon": "sng",
    "Isaiah": "isa",
    "Jeremiah": "jer",
    "Lamentations": "lam",
    "Ezekiel": "ezk",
    "Daniel": "dan",
    "Hosea": "hos",
    "Joel": "jol",
    "Amos": "amo",
    "Obadiah": "oba",
    "Jonah": "jon",
    "Micah": "mic",
    "Nahum": "nah",
    "Habakkuk": "hab",
    "Zephaniah": "zep",
    "Haggai": "hag",
    "Zechariah": "zec",
    "Malachi": "mal",
    "Matthew": "mat",
    "Mark": "mrk",
    "Luke": "luk",
    "John": "jhn",
    "Acts": "act",
    "Romans": "rom",
    "1 Corinthians": "1co",
    "2 Corinthians": "2co",
    "Galatians": "gal",
    "Ephesians": "eph",
    "Philippians": "php",
    "Colossians": "col",
    "1 Thessalonians": "1th",
    "2 Thessalonians": "2th",
    "1 Timothy": "1ti",
    "2 Timothy": "2ti",
    "Titus": "tit",
    "Philemon": "phm",
    "Hebrews": "heb",
    "James": "jas",
    "1 Peter": "1pe",
    "2 Peter": "2pe",
    "1 John": "1jn",
    "2 John": "2jn",
    "3 John": "3jn",
    "Jude": "jud",
    "Revelation": "rev",
}

# BLB may not host every modern translation; fall back to esv for unknown.
BLB_TRANSLATION: dict[str, str] = {
    "ESV": "esv",
    "KJV": "kjv",
    "NKJV": "nkjv",
    "LSB": "lsb",
}


def blb_book_abbrev(book: str) -> str | None:
    return BLB_BOOK.get(book.strip())


def blb_translation_slug(translation: str) -> str:
    return BLB_TRANSLATION.get(translation.strip().upper(), "esv")


def blb_interlinear_url(*, translation: str, book: str, chapter: int, verse: int) -> str | None:
    b = blb_book_abbrev(book)
    if not b:
        return None
    t = blb_translation_slug(translation)
    return f"https://www.blueletterbible.org/{t}/{b}/{chapter}/{verse}/"


def blb_search_url(query: str) -> str:
    from urllib.parse import quote

    q = quote(query.strip())
    return f"https://www.blueletterbible.org/search/search?q={q}"


def blb_lexicon_landing() -> str:
    return "https://www.blueletterbible.org/study/lexicon/"


def blb_strongs_concordance() -> str:
    return "https://www.blueletterbible.org/search/concordance.cfm"


def markdown_links_for_word(*, word: str, book: str, chapter: int, verse: int, translation: str) -> str:
    ref = f"{book} {chapter}:{verse}"
    lines = [
        f"**Kairos context:** {ref} ({translation.upper()})",
        "",
        "**Blue Letter Bible**",
    ]
    inter = blb_interlinear_url(translation=translation, book=book, chapter=chapter, verse=verse)
    if inter:
        lines.append(f"- [Verse / interlinear]({inter})")
    lines.append(f"- [Search “{word}”]({blb_search_url(word)})")
    lines.append(f"- [Lexicons & languages]({blb_lexicon_landing()})")
    lines.append(f"- [Strong’s concordance]({blb_strongs_concordance()})")
    lines.append("")
    lines.append(
        "*Occurrences elsewhere:* add Strong’s numbers from BLB, then search concordance; "
        "or extend Kairos with a local verse index later."
    )
    return "\n".join(lines)
