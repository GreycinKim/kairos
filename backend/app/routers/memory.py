"""Unified view of persisted Kairos data (timeline, notes, journal, reader, etc.)."""

from __future__ import annotations

from datetime import datetime, time, timezone
from urllib.parse import quote

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    JournalEntry,
    Milestone,
    Note,
    Prayer,
    ReaderHighlight,
    ReaderVerseNote,
    ScriptureLink,
    Theme,
    TimelineEvent,
    WordStudy,
)
from app.lib.journal_soap import journal_body_plain_text
from app.schemas.memory import MemoryFeedItem, MemoryFeedResponse, MemorySummaryBucket, MemorySummaryResponse

router = APIRouter(prefix="/memory", tags=["memory"])


def _snippet(text: str | None, max_len: int = 160) -> str | None:
    if not text:
        return None
    t = " ".join(text.split())
    if len(t) <= max_len:
        return t
    return t[: max_len - 1].rstrip() + "…"


def _verse_ref(link: ScriptureLink) -> str:
    end = link.verse_end if link.verse_end and link.verse_end != link.verse_start else None
    tail = f"{link.verse_start}–{end}" if end else str(link.verse_start)
    return f"{link.book} {link.chapter}:{tail}"


@router.get("/feed", response_model=MemoryFeedResponse)
async def memory_feed(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> MemoryFeedResponse:
    """Recent changes across major tables, merged by time (newest first)."""
    cap = min(limit * 3, 400)

    async def load_timeline() -> list[MemoryFeedItem]:
        r = await db.execute(
            select(TimelineEvent)
            .order_by(func.coalesce(TimelineEvent.updated_at, TimelineEvent.created_at).desc())
            .limit(cap)
        )
        rows = list(r.scalars().all())
        out: list[MemoryFeedItem] = []
        for ev in rows:
            at = ev.updated_at or ev.created_at or datetime.now(timezone.utc)
            out.append(
                MemoryFeedItem(
                    kind="timeline_event",
                    id=ev.id,
                    title=ev.title,
                    snippet=_snippet(ev.description) or _snippet(ev.era),
                    occurred_at=at,
                    route_hint=f"/timeline?event={ev.id}",
                )
            )
        return out

    async def load_notes() -> list[MemoryFeedItem]:
        r = await db.execute(select(Note).order_by(Note.updated_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="note",
                id=n.id,
                title=n.title or "Untitled note",
                snippet=_snippet(n.body),
                occurred_at=n.updated_at,
                route_hint=f"/notes?note={n.id}",
            )
            for n in rows
        ]

    async def load_journal() -> list[MemoryFeedItem]:
        r = await db.execute(select(JournalEntry).order_by(JournalEntry.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="journal",
                id=j.id,
                title=j.title or j.entry_date.isoformat(),
                snippet=_snippet(journal_body_plain_text(j.body)),
                occurred_at=j.created_at,
                route_hint=f"/journal?date={j.entry_date.isoformat()}",
            )
            for j in rows
        ]

    async def load_prayers() -> list[MemoryFeedItem]:
        r = await db.execute(select(Prayer).order_by(Prayer.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="prayer",
                id=p.id,
                title=p.title,
                snippet=_snippet(p.body),
                occurred_at=p.created_at,
                route_hint=f"/prayer?prayer={p.id}",
            )
            for p in rows
        ]

    async def load_word_studies() -> list[MemoryFeedItem]:
        r = await db.execute(select(WordStudy).order_by(WordStudy.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="word_study",
                id=w.id,
                title=w.word,
                snippet=_snippet(w.definition),
                occurred_at=w.created_at,
                route_hint=f"/word-study?study={w.id}",
            )
            for w in rows
        ]

    async def load_highlights() -> list[MemoryFeedItem]:
        r = await db.execute(select(ReaderHighlight).order_by(ReaderHighlight.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="reader_highlight",
                id=h.id,
                title=f"{h.book} {h.chapter}:{h.verse} ({h.translation})",
                snippet=_snippet(h.highlighted_text),
                occurred_at=h.created_at,
                route_hint=f"/?book={quote(h.book, safe='')}&chapter={h.chapter}&translation={quote(h.translation, safe='')}",
            )
            for h in rows
        ]

    async def load_verse_notes() -> list[MemoryFeedItem]:
        r = await db.execute(select(ReaderVerseNote).order_by(ReaderVerseNote.updated_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="reader_verse_note",
                id=n.id,
                title=f"{n.book} {n.chapter}:{n.verse} ({n.translation})",
                snippet=_snippet(n.body),
                occurred_at=n.updated_at,
                route_hint=f"/?book={quote(n.book, safe='')}&chapter={n.chapter}&translation={quote(n.translation, safe='')}",
            )
            for n in rows
        ]

    async def load_scripture_links() -> list[MemoryFeedItem]:
        r = await db.execute(select(ScriptureLink).order_by(ScriptureLink.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="scripture_link",
                id=s.id,
                title=_verse_ref(s),
                snippet=f"{s.source_type}:{str(s.source_id)[:8]}…",
                occurred_at=s.created_at,
                route_hint=f"/scripture?book={quote(s.book, safe='')}&chapter={s.chapter}&verse={s.verse_start}",
            )
            for s in rows
        ]

    async def load_milestones() -> list[MemoryFeedItem]:
        r = await db.execute(select(Milestone).order_by(Milestone.milestone_date.desc()).limit(cap))
        rows = list(r.scalars().all())
        out: list[MemoryFeedItem] = []
        for m in rows:
            occurred = datetime.combine(m.milestone_date, time.min, tzinfo=timezone.utc)
            out.append(
                MemoryFeedItem(
                    kind="milestone",
                    id=m.id,
                    title=m.title,
                    snippet=_snippet(m.description) or _snippet(m.significance),
                    occurred_at=occurred,
                    route_hint="/timeline",
                )
            )
        return out

    async def load_themes() -> list[MemoryFeedItem]:
        r = await db.execute(select(Theme).order_by(Theme.created_at.desc()).limit(cap))
        rows = list(r.scalars().all())
        return [
            MemoryFeedItem(
                kind="theme",
                id=t.id,
                title=t.name,
                snippet=_snippet(t.description),
                occurred_at=t.created_at,
                route_hint="/timeline",
            )
            for t in rows
        ]

    parts: list[list[MemoryFeedItem]] = []
    for loader in (
        load_timeline,
        load_notes,
        load_journal,
        load_prayers,
        load_word_studies,
        load_highlights,
        load_verse_notes,
        load_scripture_links,
        load_milestones,
        load_themes,
    ):
        parts.append(await loader())
    merged: list[MemoryFeedItem] = [x for part in parts for x in part]
    merged.sort(key=lambda x: x.occurred_at, reverse=True)
    total_before = len(merged)
    merged = merged[:limit]
    return MemoryFeedResponse(items=merged, truncated=total_before > limit)


@router.get("/summary", response_model=MemorySummaryResponse)
async def memory_summary(db: AsyncSession = Depends(get_db)) -> MemorySummaryResponse:
    """Row counts per persisted domain (cheap dashboard)."""

    async def cnt(model) -> int:
        r = await db.execute(select(func.count()).select_from(model))
        return int(r.scalar_one())

    kinds_models = (
        ("timeline_event", TimelineEvent),
        ("note", Note),
        ("journal", JournalEntry),
        ("prayer", Prayer),
        ("word_study", WordStudy),
        ("reader_highlight", ReaderHighlight),
        ("reader_verse_note", ReaderVerseNote),
        ("scripture_link", ScriptureLink),
        ("milestone", Milestone),
        ("theme", Theme),
    )
    pairs: list[int] = []
    for _k, model in kinds_models:
        pairs.append(await cnt(model))
    kinds = tuple(k for k, _m in kinds_models)
    buckets = [MemorySummaryBucket(kind=k, count=c) for k, c in zip(kinds, pairs)]
    return MemorySummaryResponse(buckets=buckets, total=sum(pairs))
