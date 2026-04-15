from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prayer
from app.schemas.prayer import PrayerCreate, PrayerRead, PrayerStats, PrayerUpdate

router = APIRouter(prefix="/prayers", tags=["prayers"])


@router.get("/stats", response_model=PrayerStats)
async def prayer_stats(db: AsyncSession = Depends(get_db)) -> PrayerStats:
    total = await db.scalar(select(func.count()).select_from(Prayer)) or 0
    waiting = await db.scalar(select(func.count()).select_from(Prayer).where(Prayer.status == "waiting")) or 0
    ongoing = await db.scalar(select(func.count()).select_from(Prayer).where(Prayer.status == "ongoing")) or 0
    answered = await db.scalar(select(func.count()).select_from(Prayer).where(Prayer.status == "answered")) or 0
    return PrayerStats(total=int(total), waiting=int(waiting), ongoing=int(ongoing), answered=int(answered))


@router.get("", response_model=list[PrayerRead])
async def list_prayers(
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None),
    tag: str | None = Query(None),
) -> list[Prayer]:
    q = select(Prayer).order_by(Prayer.prayed_on.desc())
    if status:
        q = q.where(Prayer.status == status)
    result = await db.execute(q)
    rows = list(result.scalars().all())
    if tag:
        rows = [p for p in rows if p.tags and tag in p.tags]
    return rows


@router.get("/{prayer_id}", response_model=PrayerRead)
async def get_prayer(prayer_id: UUID, db: AsyncSession = Depends(get_db)) -> Prayer:
    row = await db.get(Prayer, prayer_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prayer not found")
    return row


@router.post("", response_model=PrayerRead, status_code=201)
async def create_prayer(body: PrayerCreate, db: AsyncSession = Depends(get_db)) -> Prayer:
    p = Prayer(**body.model_dump())
    db.add(p)
    await db.flush()
    await db.refresh(p)
    return p


@router.patch("/{prayer_id}", response_model=PrayerRead)
async def update_prayer(prayer_id: UUID, body: PrayerUpdate, db: AsyncSession = Depends(get_db)) -> Prayer:
    row = await db.get(Prayer, prayer_id)
    if not row:
        raise HTTPException(status_code=404, detail="Prayer not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/{prayer_id}", status_code=204)
async def delete_prayer(prayer_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(Prayer).where(Prayer.id == prayer_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Prayer not found")
