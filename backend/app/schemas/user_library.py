from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Reading log (matches frontend `ReadingLogEvent` with `at`) ---


class ReadingLogEventRead(BaseModel):
    id: str
    book: str
    chapter: int
    at: datetime


class ReadingLogAppend(BaseModel):
    book: str = Field(min_length=1)
    chapter: int = Field(ge=1)
    at: datetime | None = None


class ReadingLogBulkImport(BaseModel):
    events: list[dict[str, Any]] = Field(default_factory=list)


# --- Person profiles / places (arbitrary JSON documents) ---


class PersonProfilesRead(BaseModel):
    profiles: dict[str, Any]


class PersonProfilesPut(BaseModel):
    profiles: dict[str, Any]


class PlaceRecordsRead(BaseModel):
    places: dict[str, Any]


class PlaceRecordsPut(BaseModel):
    places: dict[str, Any]
