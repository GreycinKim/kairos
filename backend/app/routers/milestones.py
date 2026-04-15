from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Milestone
from app.schemas.timeline import MilestoneCreate, MilestoneRead, MilestoneUpdate

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("", response_model=list[MilestoneRead])
async def list_milestones(db: AsyncSession = Depends(get_db)) -> list[Milestone]:
    result = await db.execute(select(Milestone).order_by(Milestone.milestone_date))
    return list(result.scalars().all())


@router.get("/{milestone_id}", response_model=MilestoneRead)
async def get_milestone(milestone_id: UUID, db: AsyncSession = Depends(get_db)) -> Milestone:
    row = await db.get(Milestone, milestone_id)
    if not row:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return row


@router.post("", response_model=MilestoneRead, status_code=201)
async def create_milestone(body: MilestoneCreate, db: AsyncSession = Depends(get_db)) -> Milestone:
    m = Milestone(**body.model_dump())
    db.add(m)
    await db.flush()
    await db.refresh(m)
    return m


@router.patch("/{milestone_id}", response_model=MilestoneRead)
async def update_milestone(
    milestone_id: UUID, body: MilestoneUpdate, db: AsyncSession = Depends(get_db)
) -> Milestone:
    row = await db.get(Milestone, milestone_id)
    if not row:
        raise HTTPException(status_code=404, detail="Milestone not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/{milestone_id}", status_code=204)
async def delete_milestone(milestone_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(Milestone).where(Milestone.id == milestone_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
