from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user_library import ReadingLogEntry
from app.schemas.user_library import ReadingLogAppend, ReadingLogBulkImport, ReadingLogEventRead

router = APIRouter(prefix="/reading-log", tags=["reading-log"])


def _row_to_read(row: ReadingLogEntry) -> ReadingLogEventRead:
    return ReadingLogEventRead(id=row.id, book=row.book, chapter=row.chapter, at=row.read_at)


@router.get("", response_model=list[ReadingLogEventRead])
async def list_reading_log(db: AsyncSession = Depends(get_db)) -> list[ReadingLogEventRead]:
    result = await db.execute(select(ReadingLogEntry).order_by(ReadingLogEntry.read_at.asc()))
    rows = list(result.scalars().all())
    return [_row_to_read(r) for r in rows]


@router.post("", response_model=ReadingLogEventRead, status_code=201)
async def append_reading_log(body: ReadingLogAppend, db: AsyncSession = Depends(get_db)) -> ReadingLogEventRead:
    read_at = body.at if body.at else datetime.now(timezone.utc)
    row = ReadingLogEntry(
        id=str(uuid4()),
        book=body.book.strip(),
        chapter=body.chapter,
        read_at=read_at,
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return _row_to_read(row)


@router.post("/bulk", response_model=list[ReadingLogEventRead], status_code=201)
async def bulk_import_reading_log(body: ReadingLogBulkImport, db: AsyncSession = Depends(get_db)) -> list[ReadingLogEventRead]:
    """Insert events that are not already present (matched by id)."""
    out: list[ReadingLogEntry] = []
    for raw in body.events:
        if not isinstance(raw, dict):
            continue
        rid = raw.get("id")
        book = raw.get("book")
        ch = raw.get("chapter")
        at_raw = raw.get("at")
        if not isinstance(rid, str) or not rid.strip():
            continue
        if not isinstance(book, str) or not book.strip():
            continue
        if not isinstance(ch, int) or ch < 1:
            continue
        existing = await db.get(ReadingLogEntry, rid.strip())
        if existing:
            continue
        read_at: datetime
        if isinstance(at_raw, str):
            try:
                read_at = datetime.fromisoformat(at_raw.replace("Z", "+00:00"))
            except ValueError:
                read_at = datetime.now(timezone.utc)
        elif isinstance(at_raw, datetime):
            read_at = at_raw
        else:
            read_at = datetime.now(timezone.utc)
        row = ReadingLogEntry(id=rid.strip(), book=book.strip(), chapter=ch, read_at=read_at)
        db.add(row)
        out.append(row)
    await db.flush()
    for r in out:
        await db.refresh(r)
    return [_row_to_read(r) for r in out]


@router.delete("/{entry_id}", status_code=204)
async def delete_reading_log_entry(entry_id: str, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ReadingLogEntry).where(ReadingLogEntry.id == entry_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
