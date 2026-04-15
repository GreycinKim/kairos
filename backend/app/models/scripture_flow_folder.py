import uuid

from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class ScriptureFlowFolder(Base):
    """User-defined folders to organize sermon passage maps."""

    __tablename__ = "scripture_flow_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False, server_default="Untitled folder")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
