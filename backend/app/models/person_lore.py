"""Normalized storage for person/ruler lore (edit form + lore page). Replaces monolithic person_profiles.profile JSONB."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class PersonLoreDetail(Base):
    """One row per timeline person/ruler — scalar fields + portrait + atlas pin + optional related-event ids."""

    __tablename__ = "person_lore_detail"

    event_id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(Text, nullable=False, server_default="")
    scope = Column(Text, nullable=False, server_default="bible")
    figure_kind = Column(Text, nullable=True)
    title = Column(Text, nullable=True)
    biography = Column(Text, nullable=True)
    died_year = Column(Integer, nullable=True)
    ruled_from_year = Column(Integer, nullable=True)
    ruled_to_year = Column(Integer, nullable=True)
    hidden = Column(Boolean, nullable=False, server_default="false")
    image_data_url = Column(Text, nullable=True)
    atlas_catalog_map_id = Column(Text, nullable=True)
    atlas_nx = Column(Float, nullable=True)
    atlas_ny = Column(Float, nullable=True)
    related_event_ids = Column(JSONB, nullable=False, server_default="[]")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PersonLoreScriptureRow(Base):
    __tablename__ = "person_lore_scripture"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    event_id = Column(UUID(as_uuid=True), ForeignKey("person_lore_detail.event_id", ondelete="CASCADE"), nullable=False, index=True)
    book = Column(Text, nullable=False)
    chapter = Column(Integer, nullable=False)
    sort_order = Column(Integer, nullable=False, server_default="0")


class PersonLoreCardRow(Base):
    __tablename__ = "person_lore_card"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("person_lore_detail.event_id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(Text, nullable=False, server_default="event")
    title = Column(Text, nullable=False, server_default="")
    body = Column(Text, nullable=False, server_default="")
    image_data_url = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, server_default="0")


class PersonLoreCalloutRow(Base):
    __tablename__ = "person_lore_callout"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("person_lore_detail.event_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=False, server_default="")
    body = Column(Text, nullable=False, server_default="")
    sort_order = Column(Integer, nullable=False, server_default="0")


class PersonLoreFamilyLinkRow(Base):
    __tablename__ = "person_lore_family_link"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("person_lore_detail.event_id", ondelete="CASCADE"), nullable=False, index=True)
    relation = Column(Text, nullable=False)
    linked_person_event_id = Column(UUID(as_uuid=True), nullable=False, index=True)
