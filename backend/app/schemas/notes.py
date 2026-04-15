from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.themes import ThemeSnippet


class TagBase(BaseModel):
    name: str
    color: str | None = None


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID


class NoteBase(BaseModel):
    event_id: UUID
    title: str | None = None
    body: str | None = None
    is_private: bool = True
    tag_ids: list[UUID] | None = None
    theme_ids: list[UUID] | None = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    is_private: bool | None = None
    tag_ids: list[UUID] | None = None
    theme_ids: list[UUID] | None = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    title: str | None = None
    body: str | None = None
    is_private: bool
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = []
    themes: list[ThemeSnippet] = []


class NoteLinkBase(BaseModel):
    source_note_id: UUID
    target_note_id: UUID
    link_type: str | None = None


class NoteLinkCreate(NoteLinkBase):
    pass


class NoteLinkRead(NoteLinkBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
