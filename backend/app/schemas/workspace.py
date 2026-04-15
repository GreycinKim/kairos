from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WorkspaceClientStateRead(BaseModel):
    workspace_key: str
    people_profiles: dict[str, Any]
    places: dict[str, Any]
    event_display: dict[str, Any]
    event_scripture: dict[str, Any]
    atlas_routes: list[Any]
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceClientStatePut(BaseModel):
    """Partial update: only sent keys are merged onto the stored row."""

    people_profiles: dict[str, Any] | None = None
    places: dict[str, Any] | None = None
    event_display: dict[str, Any] | None = None
    event_scripture: dict[str, Any] | None = None
    atlas_routes: list[Any] | None = Field(default=None, description="Full list replacement when set")
