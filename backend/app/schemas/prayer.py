from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PrayerBase(BaseModel):
    title: str
    body: str | None = None
    status: str = "waiting"
    prayed_on: date
    answered_on: date | None = None
    answer_notes: str | None = None
    linked_event_id: UUID | None = None
    tags: list[str] | None = None


class PrayerCreate(PrayerBase):
    pass


class PrayerUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    status: str | None = None
    prayed_on: date | None = None
    answered_on: date | None = None
    answer_notes: str | None = None
    linked_event_id: UUID | None = None
    tags: list[str] | None = None


class PrayerRead(PrayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class PrayerStats(BaseModel):
    total: int
    waiting: int
    ongoing: int
    answered: int
