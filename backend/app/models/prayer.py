import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.database import Base


class Prayer(Base):
    __tablename__ = "prayers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=True)
    status = Column(Text, nullable=True, server_default="waiting")
    prayed_on = Column(Date, nullable=False)
    answered_on = Column(Date, nullable=True)
    answer_notes = Column(Text, nullable=True)
    linked_event_id = Column(UUID(as_uuid=True), ForeignKey("timeline_events.id", ondelete="SET NULL"), nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
