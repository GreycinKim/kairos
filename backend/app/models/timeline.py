import uuid

from sqlalchemy import Column, Date, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
    start_year = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    color = Column(Text, nullable=True)
    icon = Column(Text, nullable=True)
    era = Column(Text, nullable=True)
    author = Column(Text, nullable=True)
    written_start_year = Column(Integer, nullable=True)
    written_end_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    milestone_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    significance = Column(Text, nullable=True)
    icon = Column(Text, nullable=True)
