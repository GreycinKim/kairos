import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.database import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_date = Column(Date, nullable=False)
    title = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    mood = Column(Text, nullable=True)
    prayer_requests = Column(Text, nullable=True)
    answered_prayers = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    linked_event_id = Column(UUID(as_uuid=True), ForeignKey("timeline_events.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
