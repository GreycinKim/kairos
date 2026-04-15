from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class WorkspaceClientState(Base):
    """
    Shared browser-local data (people profiles, places, etc.) for one deployment.
    One row per workspace_key (default singleton).
    """

    __tablename__ = "workspace_client_state"

    workspace_key = Column(Text, primary_key=True)
    people_profiles = Column(JSONB, nullable=False)
    places = Column(JSONB, nullable=False)
    event_display = Column(JSONB, nullable=False)
    event_scripture = Column(JSONB, nullable=False)
    atlas_routes = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
