from datetime import datetime

from pydantic import BaseModel, Field


class JbchLink(BaseModel):
    text: str
    href: str


class JbchPageSlice(BaseModel):
    source_url: str
    requires_auth: bool = False
    links: list[JbchLink] = Field(default_factory=list)
    text_blocks: list[str] = Field(default_factory=list)


class JbchRecitationCard(BaseModel):
    title: str
    reference: str
    text: str


class JbchHubRead(BaseModel):
    fetched_at: datetime | None = None
    note: str | None = None
    index: JbchPageSlice
    dictionary: JbchPageSlice
    recitation_page: JbchPageSlice
    recitation_cards: list[JbchRecitationCard] = Field(default_factory=list)
