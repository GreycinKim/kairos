import uuid

from sqlalchemy import Column, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ReaderHighlight(Base):
    __tablename__ = "reader_highlights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book = Column(Text, nullable=False)
    chapter = Column(Integer, nullable=False)
    verse = Column(Integer, nullable=False)
    translation = Column(Text, nullable=False, server_default="ESV")
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    color = Column(Text, nullable=False, server_default="#fef08a")
    highlighted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReaderVerseNote(Base):
    __tablename__ = "reader_verse_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book = Column(Text, nullable=False)
    chapter = Column(Integer, nullable=False)
    verse = Column(Integer, nullable=False)
    translation = Column(Text, nullable=False, server_default="ESV")
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
