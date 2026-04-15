from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import JournalEntry, Note, Prayer, Theme, TimelineEvent, WordStudy
from app.schemas.search import SearchHit, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])

LIMIT = 12


@router.get("", response_model=SearchResponse)
async def global_search(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)) -> SearchResponse:
    pat = f"%{q}%"
    results: dict[str, list[SearchHit]] = {
        "timeline": [],
        "notes": [],
        "journal": [],
        "word_studies": [],
        "prayers": [],
        "themes": [],
    }

    te = (
        await db.execute(
            select(TimelineEvent)
            .where(
                or_(
                    TimelineEvent.title.ilike(pat),
                    TimelineEvent.description.ilike(pat),
                    TimelineEvent.era.ilike(pat),
                    TimelineEvent.author.ilike(pat),
                )
            )
            .limit(LIMIT)
        )
    ).scalars().all()
    for row in te:
        results["timeline"].append(
            SearchHit(
                id=row.id,
                type="timeline",
                title=row.title,
                snippet=row.era or row.description,
                route_hint=f"/timeline?event={row.id}",
            )
        )

    notes = (
        await db.execute(
            select(Note).where(or_(Note.title.ilike(pat), Note.body.ilike(pat))).limit(LIMIT)
        )
    ).scalars().all()
    for row in notes:
        results["notes"].append(
            SearchHit(
                id=row.id,
                type="note",
                title=row.title or "Untitled note",
                snippet=(row.body or "")[:120] or None,
                route_hint=f"/notes?note={row.id}",
            )
        )

    journal = (
        await db.execute(
            select(JournalEntry).where(or_(JournalEntry.title.ilike(pat), JournalEntry.body.ilike(pat))).limit(LIMIT)
        )
    ).scalars().all()
    for row in journal:
        results["journal"].append(
            SearchHit(
                id=row.id,
                type="journal",
                title=row.title or row.entry_date.isoformat(),
                snippet=(row.body or "")[:120] or None,
                route_hint=f"/journal?date={row.entry_date.isoformat()}",
            )
        )

    ws = (
        await db.execute(
            select(WordStudy).where(
                or_(
                    WordStudy.word.ilike(pat),
                    WordStudy.transliteration.ilike(pat),
                    WordStudy.strongs_number.ilike(pat),
                    WordStudy.definition.ilike(pat),
                )
            ).limit(LIMIT)
        )
    ).scalars().all()
    for row in ws:
        vr = " ".join(row.verse_references or [])[:80]
        results["word_studies"].append(
            SearchHit(
                id=row.id,
                type="word_study",
                title=row.word,
                snippet=row.strongs_number or vr or None,
                route_hint=f"/word-study?study={row.id}",
            )
        )

    prayers = (
        await db.execute(
            select(Prayer).where(or_(Prayer.title.ilike(pat), Prayer.body.ilike(pat))).limit(LIMIT)
        )
    ).scalars().all()
    for row in prayers:
        results["prayers"].append(
            SearchHit(
                id=row.id,
                type="prayer",
                title=row.title,
                snippet=(row.body or "")[:120] or None,
                route_hint=f"/prayer?prayer={row.id}",
            )
        )

    themes = (
        await db.execute(select(Theme).where(Theme.name.ilike(pat)).limit(LIMIT))
    ).scalars().all()
    for row in themes:
        results["themes"].append(
            SearchHit(
                id=row.id,
                type="theme",
                title=row.name,
                snippet=row.description,
                route_hint="/timeline",
            )
        )

    return SearchResponse(query=q, results=results)
