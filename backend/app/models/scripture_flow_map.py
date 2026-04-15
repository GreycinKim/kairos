import uuid
from typing import Any

from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class ScriptureFlowMap(Base):
    """Sermon-style notes (markdown) plus interactive passage graph (React Flow JSON)."""

    __tablename__ = "scripture_flow_maps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    folder_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scripture_flow_folders.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(Text, nullable=False, server_default="Untitled map")
    notes_markdown = Column(Text, nullable=False, server_default="")
    graph_json = Column(JSONB, nullable=False, server_default='{"nodes": [], "edges": []}')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def graph_dict(self) -> dict[str, Any]:
        g = self.graph_json
        if isinstance(g, dict):
            return g
        return {"nodes": [], "edges": []}
