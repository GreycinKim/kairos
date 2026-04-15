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
    """Replace the server’s person profile set with this map (upsert per id, remove rows missing from the map)."""

    profiles: dict[str, Any] = Field(
        ...,
        description=(
            "Map of timeline event id (UUID string) → profile object. Persisted verbatim as JSONB, including "
            "`imageDataUrl` (profile photo) and `loreCards[].imageDataUrl` (lore images), plus biography, "
            "loreCallouts, familyLinks, scriptureAppearances, atlasPin, etc. Send `{}` only to clear all profiles."
        ),
    )


class PlaceRecordsRead(BaseModel):
    places: dict[str, Any]


class PlaceRecordsPut(BaseModel):
    places: dict[str, Any]
