from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.themes import ThemeSnippet


class JournalEntryBase(BaseModel):
    entry_date: date
    title: str | None = None
    body: str | None = None
    prayer_requests: str | None = None
    answered_prayers: str | None = None
    tags: list[str] | None = None
    linked_event_id: UUID | None = None


class JournalEntryCreate(JournalEntryBase):
    theme_ids: list[UUID] | None = None


class JournalEntryUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    prayer_requests: str | None = None
    answered_prayers: str | None = None
    tags: list[str] | None = None
    linked_event_id: UUID | None = None
    theme_ids: list[UUID] | None = None


class JournalEntryRead(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    themes: list[ThemeSnippet] = []
