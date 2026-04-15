from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ScriptureFlowFolderCreate(BaseModel):
    title: str = "Untitled folder"


class ScriptureFlowFolderUpdate(BaseModel):
    title: str | None = None


class ScriptureFlowFolderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    created_at: datetime


class ScriptureFlowMapCreate(BaseModel):
    title: str = "Untitled map"
    folder_id: UUID | None = None


class ScriptureFlowMapUpdate(BaseModel):
    title: str | None = None
    notes_markdown: str | None = None
    graph_json: dict[str, Any] | None = None
    folder_id: UUID | None = None


class ScriptureFlowMapRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    notes_markdown: str
    graph_json: dict[str, Any] = Field(default_factory=dict)
    folder_id: UUID | None = None
    updated_at: datetime


class FlowMapVerseMention(BaseModel):
    map_id: UUID
    map_title: str
    span_label: str


class FlowMapEdgeHit(BaseModel):
    map_id: UUID
    map_title: str
    ref_label: str
    kind: str


class FlowMapVerseRollup(BaseModel):
    in_maps: list[FlowMapVerseMention] = Field(default_factory=list)
    leads_to: list[FlowMapEdgeHit] = Field(default_factory=list)
    led_from: list[FlowMapEdgeHit] = Field(default_factory=list)


class FlowMapChapterIndexResponse(BaseModel):
    """Per-verse rollup of sermon passage map nodes and edges for one chapter."""

    verses: dict[str, FlowMapVerseRollup] = Field(default_factory=dict)
