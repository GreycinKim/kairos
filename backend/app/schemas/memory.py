from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryFeedItem(BaseModel):
    """One persisted item in the unified chronological memory stream."""

    kind: str = Field(
        ...,
        description="timeline_event | note | journal | prayer | word_study | reader_highlight | reader_verse_note | scripture_link | milestone | theme",
    )
    id: UUID
    title: str
    snippet: str | None = None
    occurred_at: datetime
    route_hint: str


class MemoryFeedResponse(BaseModel):
    items: list[MemoryFeedItem]
    truncated: bool = Field(False, description="True if more rows existed than returned after merge")


class MemorySummaryBucket(BaseModel):
    kind: str
    count: int


class MemorySummaryResponse(BaseModel):
    buckets: list[MemorySummaryBucket]
    total: int
