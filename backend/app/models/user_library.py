"""First-class rows for reading history, person lore profiles, and atlas places (replaces workspace JSON blobs)."""

from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class ReadingLogEntry(Base):
    __tablename__ = "reading_log_entries"

    id = Column(Text, primary_key=True)
    book = Column(Text, nullable=False)
    chapter = Column(Integer, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PersonProfileRow(Base):
    """Extra fields for timeline person/ruler events (one row per event id)."""

    __tablename__ = "person_profiles"

    # No FK: imports and legacy blobs may reference ids not yet present in timeline_events.
    event_id = Column(UUID(as_uuid=True), primary_key=True)
    profile = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PlaceRecordRow(Base):
    __tablename__ = "place_records"

    id = Column(Text, primary_key=True)
    place = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
