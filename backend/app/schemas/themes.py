from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ThemeSnippet(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str | None = None


class ThemeCreate(BaseModel):
    name: str
    color: str | None = None
    description: str | None = None


class ThemeUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    description: str | None = None


class ThemeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str | None = None
    description: str | None = None
    created_at: datetime


class ThemeInsights(BaseModel):
    count_30: int
    count_90: int
    count_all: int
    label: str


class ThemeTagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    theme_id: UUID
    source_type: str
    source_id: UUID
    tagged_on: date
