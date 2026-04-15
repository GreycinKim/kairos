import uuid

from sqlalchemy import Column, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ScriptureLink(Base):
    __tablename__ = "scripture_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(Text, nullable=False)
    source_id = Column(UUID(as_uuid=True), nullable=False)
    book = Column(Text, nullable=False)
    chapter = Column(Integer, nullable=False)
    verse_start = Column(Integer, nullable=False)
    verse_end = Column(Integer, nullable=True)
    translation = Column(Text, nullable=True, server_default="WEB")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
