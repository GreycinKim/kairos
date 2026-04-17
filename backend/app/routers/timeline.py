from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, nullslast, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import TimelineEvent
from app.schemas.timeline import (
    TimelineBulkDeleteRequest,
    TimelineBulkDeleteResult,
    TimelineEventCreate,
    TimelineEventRead,
    TimelineEventUpdate,
)

router = APIRouter(prefix="/timeline/events", tags=["timeline"])


@router.get("", response_model=list[TimelineEventRead])
async def list_events(
    db: AsyncSession = Depends(get_db),
    types: str | None = Query(None, description="Comma-separated event types"),
) -> list[TimelineEvent]:
    q = select(TimelineEvent).order_by(
        nullslast(TimelineEvent.start_year),
        TimelineEvent.start_date,
        TimelineEvent.title,
    )
    if types:
        type_list = [t.strip() for t in types.split(",") if t.strip()]
        if type_list:
            q = q.where(TimelineEvent.type.in_(type_list))
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/{event_id}", response_model=TimelineEventRead)
async def get_event(event_id: UUID, db: AsyncSession = Depends(get_db)) -> TimelineEvent:
    row = await db.get(TimelineEvent, event_id)
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


@router.post("", response_model=TimelineEventRead, status_code=201)
async def create_event(body: TimelineEventCreate, db: AsyncSession = Depends(get_db)) -> TimelineEvent:
    ev = TimelineEvent(**body.model_dump())
    db.add(ev)
    await db.flush()
    await db.refresh(ev)
    return ev


@router.patch("/{event_id}", response_model=TimelineEventRead)
async def update_event(
    event_id: UUID, body: TimelineEventUpdate, db: AsyncSession = Depends(get_db)
) -> TimelineEvent:
    row = await db.get(TimelineEvent, event_id)
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(TimelineEvent).where(TimelineEvent.id == event_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Event not found")


@router.post("/bulk-delete", response_model=TimelineBulkDeleteResult)
async def bulk_delete_events(
    body: TimelineBulkDeleteRequest, db: AsyncSession = Depends(get_db)
) -> TimelineBulkDeleteResult:
    ids = list(dict.fromkeys(body.event_ids))
    if not ids:
        return TimelineBulkDeleteResult(deleted=0)
    res = await db.execute(delete(TimelineEvent).where(TimelineEvent.id.in_(ids)))
    return TimelineBulkDeleteResult(deleted=int(res.rowcount or 0))
