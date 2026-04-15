from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReaderHighlightCreate(BaseModel):
    book: str
    chapter: int = Field(ge=1)
    verse: int = Field(ge=1)
    translation: str = Field(default="ESV", max_length=16)
    start_offset: int = Field(ge=0)
    end_offset: int = Field(ge=0)
    color: str = Field(default="#fef08a", max_length=32)
    highlighted_text: str | None = None


class ReaderHighlightRead(ReaderHighlightCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class ReaderVerseNoteCreate(BaseModel):
    book: str
    chapter: int = Field(ge=1)
    verse: int = Field(ge=1)
    translation: str = Field(default="ESV", max_length=16)
    body: str = Field(min_length=1)


class ReaderVerseNoteUpdate(BaseModel):
    body: str = Field(min_length=1)


class ReaderVerseNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    book: str
    chapter: int
    verse: int
    translation: str
    body: str
    created_at: datetime
    updated_at: datetime
