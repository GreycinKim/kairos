from typing import Any
from uuid import UUID

from pydantic import BaseModel


class SearchHit(BaseModel):
    id: UUID
    type: str
    title: str
    snippet: str | None = None
    route_hint: str


class SearchResponse(BaseModel):
    query: str
    results: dict[str, list[SearchHit]]
