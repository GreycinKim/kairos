from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScriptureLinkBase(BaseModel):
    source_type: str
    source_id: UUID
    book: str
    chapter: int
    verse_start: int
    verse_end: int | None = None
    translation: str | None = "WEB"


class ScriptureLinkCreate(ScriptureLinkBase):
    pass


class ScriptureLinkUpdate(BaseModel):
    book: str | None = None
    chapter: int | None = None
    verse_start: int | None = None
    verse_end: int | None = None
    translation: str | None = None


class ScriptureLinkRead(ScriptureLinkBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class VerseTextResponse(BaseModel):
    reference: str
    text: str
    translation: str


class ChapterVerseRow(BaseModel):
    verse: int
    text: str
    section_title: str | None = None


class ChapterTextResponse(BaseModel):
    reference: str
    translation: str
    book: str
    chapter: int
    verses: list[ChapterVerseRow]
