from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WordStudyBase(BaseModel):
    word: str
    transliteration: str | None = None
    language: str | None = None
    strongs_number: str | None = None
    definition: str | None = None
    extended_notes: str | None = None
    verse_references: list[str] | None = None


class WordStudyCreate(WordStudyBase):
    pass


class WordStudyUpdate(BaseModel):
    word: str | None = None
    transliteration: str | None = None
    language: str | None = None
    strongs_number: str | None = None
    definition: str | None = None
    extended_notes: str | None = None
    verse_references: list[str] | None = None


class WordStudyRead(WordStudyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class WordStudyLinkCreate(BaseModel):
    word_study_id: UUID
    note_id: UUID


class WordStudyFromReaderCreate(BaseModel):
    """Create a word-study card from reader selection (links to Blue Letter Bible for Greek/Hebrew)."""

    word: str = Field(min_length=1, max_length=200)
    book: str
    chapter: int = Field(ge=1)
    verse: int = Field(ge=1)
    translation: str = Field(default="ESV", max_length=16)
