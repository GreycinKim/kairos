from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import JournalEntry
from app.schemas.journal import JournalEntryCreate, JournalEntryRead, JournalEntryUpdate
from app.schemas.themes import ThemeSnippet
from app.services.theme_tags import batch_themes_by_source, replace_theme_tags

router = APIRouter(prefix="/journal", tags=["journal"])


async def _journal_reads(db: AsyncSession, entries: list[JournalEntry]) -> list[JournalEntryRead]:
    if not entries:
        return []
    ids = [e.id for e in entries]
    tmap = await batch_themes_by_source(db, "journal", ids)
    return [
        JournalEntryRead(
            id=e.id,
            entry_date=e.entry_date,
            title=e.title,
            body=e.body,
            prayer_requests=e.prayer_requests,
            answered_prayers=e.answered_prayers,
            tags=e.tags,
            linked_event_id=e.linked_event_id,
            created_at=e.created_at,
            themes=[ThemeSnippet.model_validate(t) for t in tmap.get(e.id, [])],
        )
        for e in entries
    ]


@router.get("/entries", response_model=list[JournalEntryRead])
async def list_entries(
    db: AsyncSession = Depends(get_db),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
) -> list[JournalEntryRead]:
    q = select(JournalEntry).order_by(JournalEntry.entry_date.desc())
    if from_date:
        q = q.where(JournalEntry.entry_date >= from_date)
    if to_date:
        q = q.where(JournalEntry.entry_date <= to_date)
    result = await db.execute(q)
    rows = list(result.scalars().all())
    return await _journal_reads(db, rows)


@router.get("/entries/{entry_id}", response_model=JournalEntryRead)
async def get_entry(entry_id: UUID, db: AsyncSession = Depends(get_db)) -> JournalEntryRead:
    row = await db.get(JournalEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    return (await _journal_reads(db, [row]))[0]


@router.get("/entries/by-date/{entry_date}", response_model=Optional[JournalEntryRead])
async def get_entry_by_date(entry_date: date, db: AsyncSession = Depends(get_db)) -> Optional[JournalEntryRead]:
    result = await db.execute(select(JournalEntry).where(JournalEntry.entry_date == entry_date))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return (await _journal_reads(db, [row]))[0]


@router.post("/entries", response_model=JournalEntryRead, status_code=201)
async def create_entry(body: JournalEntryCreate, db: AsyncSession = Depends(get_db)) -> JournalEntryRead:
    data = body.model_dump(exclude={"theme_ids"})
    theme_ids = body.theme_ids or []
    e = JournalEntry(**data)
    e.mood = None
    db.add(e)
    await db.flush()
    await db.refresh(e)
    await replace_theme_tags(db, source_type="journal", source_id=e.id, theme_ids=theme_ids)
    return (await _journal_reads(db, [e]))[0]


@router.patch("/entries/{entry_id}", response_model=JournalEntryRead)
async def update_entry(
    entry_id: UUID, body: JournalEntryUpdate, db: AsyncSession = Depends(get_db)
) -> JournalEntryRead:
    row = await db.get(JournalEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = body.model_dump(exclude_unset=True)
    theme_ids = data.pop("theme_ids", None)
    for k, v in data.items():
        setattr(row, k, v)
    row.mood = None
    await db.flush()
    await db.refresh(row)
    if theme_ids is not None:
        await replace_theme_tags(db, source_type="journal", source_id=row.id, theme_ids=theme_ids)
    return (await _journal_reads(db, [row]))[0]


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_entry(entry_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(JournalEntry).where(JournalEntry.id == entry_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
