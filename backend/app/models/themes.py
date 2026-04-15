import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Theme(Base):
    __tablename__ = "themes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, unique=True, nullable=False)
    color = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ThemeTag(Base):
    __tablename__ = "theme_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    theme_id = Column(UUID(as_uuid=True), ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(Text, nullable=False)
    source_id = Column(UUID(as_uuid=True), nullable=False)
    tagged_on = Column(Date, nullable=False)
