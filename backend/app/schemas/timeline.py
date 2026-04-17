from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TimelineEventBase(BaseModel):
    title: str
    type: str
    start_year: int | None = None
    end_year: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None
    era: str | None = None
    author: str | None = None
    written_start_year: int | None = None
    written_end_year: int | None = None


class TimelineEventCreate(TimelineEventBase):
    pass


class TimelineEventUpdate(BaseModel):
    title: str | None = None
    type: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None
    era: str | None = None
    author: str | None = None
    written_start_year: int | None = None
    written_end_year: int | None = None


class TimelineEventRead(TimelineEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class TimelineBulkDeleteRequest(BaseModel):
    event_ids: list[UUID]


class TimelineBulkDeleteResult(BaseModel):
    deleted: int


class MilestoneBase(BaseModel):
    title: str
    milestone_date: date
    description: str | None = None
    significance: str | None = None
    icon: str | None = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: str | None = None
    milestone_date: date | None = None
    description: str | None = None
    significance: str | None = None
    icon: str | None = None


class MilestoneRead(MilestoneBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
