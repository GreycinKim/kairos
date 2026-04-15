from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.database import get_db
from app.models.reader import ReaderHighlight, ReaderVerseNote
from app.schemas.reader import (
    ReaderHighlightCreate,
    ReaderHighlightRead,
    ReaderVerseNoteCreate,
    ReaderVerseNoteRead,
    ReaderVerseNoteUpdate,
)

router = APIRouter(prefix="/reader", tags=["reader"])


@router.get("/highlights", response_model=list[ReaderHighlightRead])
async def list_highlights(
    db: AsyncSession = Depends(get_db),
    book: str = Query(...),
    chapter: int = Query(..., ge=1),
    translation: str = Query("ESV"),
) -> list[ReaderHighlight]:
    q = (
        select(ReaderHighlight)
        .where(
            ReaderHighlight.book == book.strip(),
            ReaderHighlight.chapter == chapter,
            ReaderHighlight.translation == translation.strip().upper(),
        )
        .order_by(ReaderHighlight.verse, ReaderHighlight.start_offset)
    )
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/highlights", response_model=ReaderHighlightRead, status_code=201)
async def create_highlight(body: ReaderHighlightCreate, db: AsyncSession = Depends(get_db)) -> ReaderHighlight:
    if body.end_offset < body.start_offset:
        raise HTTPException(status_code=400, detail="end_offset must be >= start_offset")
    row = ReaderHighlight(
        book=body.book.strip(),
        chapter=body.chapter,
        verse=body.verse,
        translation=body.translation.strip().upper(),
        start_offset=body.start_offset,
        end_offset=body.end_offset,
        color=body.color,
        highlighted_text=body.highlighted_text,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/highlights/{highlight_id}", status_code=204)
async def delete_highlight(highlight_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ReaderHighlight).where(ReaderHighlight.id == highlight_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Highlight not found")


@router.get("/verse-notes", response_model=list[ReaderVerseNoteRead])
async def list_verse_notes(
    db: AsyncSession = Depends(get_db),
    book: str = Query(...),
    chapter: int = Query(..., ge=1),
    translation: str = Query("ESV"),
) -> list[ReaderVerseNote]:
    q = (
        select(ReaderVerseNote)
        .where(
            ReaderVerseNote.book == book.strip(),
            ReaderVerseNote.chapter == chapter,
            ReaderVerseNote.translation == translation.strip().upper(),
        )
        .order_by(ReaderVerseNote.verse, ReaderVerseNote.created_at)
    )
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/verse-notes", response_model=ReaderVerseNoteRead, status_code=201)
async def create_verse_note(body: ReaderVerseNoteCreate, db: AsyncSession = Depends(get_db)) -> ReaderVerseNote:
    row = ReaderVerseNote(
        book=body.book.strip(),
        chapter=body.chapter,
        verse=body.verse,
        translation=body.translation.strip().upper(),
        body=body.body.strip(),
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.patch("/verse-notes/{note_id}", response_model=ReaderVerseNoteRead)
async def update_verse_note(
    note_id: UUID, body: ReaderVerseNoteUpdate, db: AsyncSession = Depends(get_db)
) -> ReaderVerseNote:
    row = await db.get(ReaderVerseNote, note_id)
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    row.body = body.body.strip()
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/verse-notes/{note_id}", status_code=204)
async def delete_verse_note(note_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ReaderVerseNote).where(ReaderVerseNote.id == note_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")
