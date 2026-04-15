"""normalized person lore tables (replaces person_profiles JSONB)

Revision ID: 008
Revises: 007
Create Date: 2026-04-15

"""

from __future__ import annotations

import json
from typing import Any, Sequence, Union
from uuid import UUID as PyUUID

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _mi(v: Any) -> int | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        return int(v)
    return None


def upgrade() -> None:
    op.create_table(
        "person_lore_detail",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False, server_default=""),
        sa.Column("scope", sa.Text(), nullable=False, server_default="bible"),
        sa.Column("figure_kind", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("died_year", sa.Integer(), nullable=True),
        sa.Column("ruled_from_year", sa.Integer(), nullable=True),
        sa.Column("ruled_to_year", sa.Integer(), nullable=True),
        sa.Column("hidden", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("image_data_url", sa.Text(), nullable=True),
        sa.Column("atlas_catalog_map_id", sa.Text(), nullable=True),
        sa.Column("atlas_nx", sa.Float(), nullable=True),
        sa.Column("atlas_ny", sa.Float(), nullable=True),
        sa.Column("related_event_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.create_table(
        "person_lore_scripture",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("book", sa.Text(), nullable=False),
        sa.Column("chapter", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["event_id"], ["person_lore_detail.event_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_person_lore_scripture_event_id", "person_lore_scripture", ["event_id"])
    op.create_table(
        "person_lore_card",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False, server_default="event"),
        sa.Column("title", sa.Text(), nullable=False, server_default=""),
        sa.Column("body", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_data_url", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["event_id"], ["person_lore_detail.event_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_person_lore_card_event_id", "person_lore_card", ["event_id"])
    op.create_table(
        "person_lore_callout",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), nullable=False, server_default=""),
        sa.Column("body", sa.Text(), nullable=False, server_default=""),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["event_id"], ["person_lore_detail.event_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_person_lore_callout_event_id", "person_lore_callout", ["event_id"])
    op.create_table(
        "person_lore_family_link",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("relation", sa.Text(), nullable=False),
        sa.Column("linked_person_event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["person_lore_detail.event_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_person_lore_family_link_event_id", "person_lore_family_link", ["event_id"])
    op.create_index("ix_person_lore_family_link_linked", "person_lore_family_link", ["linked_person_event_id"])

    bind = op.get_bind()
    rows = bind.execute(text("SELECT event_id, profile FROM person_profiles")).fetchall()
    for event_id, profile in rows:
        if profile is None:
            continue
        prof: dict[str, Any] = profile if isinstance(profile, dict) else json.loads(profile) if isinstance(profile, str) else {}
        eid = PyUUID(str(event_id)) if not isinstance(event_id, PyUUID) else event_id
        name = str(prof.get("name") or "").strip() or "Unknown"
        scope = prof.get("scope") if prof.get("scope") in ("bible", "church_history") else "bible"
        fk = prof.get("figureKind")
        fk_s = str(fk) if fk is not None else None
        title = prof.get("title")
        title_s = str(title) if title is not None else None
        bio = prof.get("biography")
        bio_s = str(bio) if bio is not None else None
        died = _mi(prof.get("diedYear"))
        rf = _mi(prof.get("ruledFromYear"))
        rt = _mi(prof.get("ruledToYear"))
        hidden = bool(prof.get("hidden"))
        img = prof.get("imageDataUrl")
        img_s = str(img) if isinstance(img, str) and img else None
        pin = prof.get("atlasPin") if isinstance(prof.get("atlasPin"), dict) else {}
        cat = pin.get("catalogMapId") if isinstance(pin.get("catalogMapId"), str) else None
        try:
            nx = float(pin["nx"]) if cat and pin.get("nx") is not None else None
            ny = float(pin["ny"]) if cat and pin.get("ny") is not None else None
        except (TypeError, ValueError, KeyError):
            cat, nx, ny = None, None, None
        rel = prof.get("relatedEventIds")
        rel_json = json.dumps(rel if isinstance(rel, list) else [])

        bind.execute(
            text(
                """
                INSERT INTO person_lore_detail (
                    event_id, name, scope, figure_kind, title, biography,
                    died_year, ruled_from_year, ruled_to_year, hidden, image_data_url,
                    atlas_catalog_map_id, atlas_nx, atlas_ny, related_event_ids
                ) VALUES (
                    :eid, :name, :scope, :figure_kind, :title, :biography,
                    :died, :rf, :rt, :hidden, :img,
                    :cat, :nx, :ny, CAST(:rel AS jsonb)
                )
                """
            ),
            {
                "eid": eid,
                "name": name,
                "scope": scope,
                "figure_kind": fk_s,
                "title": title_s,
                "biography": bio_s,
                "died": died if isinstance(died, int) else None,
                "rf": rf if isinstance(rf, int) else None,
                "rt": rt if isinstance(rt, int) else None,
                "hidden": hidden,
                "img": img_s,
                "cat": cat,
                "nx": nx,
                "ny": ny,
                "rel": rel_json,
            },
        )

        srows = prof.get("scriptureAppearances") or []
        if isinstance(srows, list):
            for i, row in enumerate(srows):
                if not isinstance(row, dict):
                    continue
                book = str(row.get("book") or "").strip()
                ch = row.get("chapter")
                if not book or not isinstance(ch, (int, float)):
                    continue
                bind.execute(
                    text(
                        "INSERT INTO person_lore_scripture (id, event_id, book, chapter, sort_order) "
                        "VALUES (gen_random_uuid(), :eid, :book, :ch, :ord)"
                    ),
                    {"eid": eid, "book": book, "ch": int(ch), "ord": i},
                )

        cards = prof.get("loreCards") or []
        if isinstance(cards, list):
            for i, c in enumerate(cards):
                if not isinstance(c, dict):
                    continue
                kind = str(c.get("kind") or "event")
                t = str(c.get("title") or "").strip()
                body = str(c.get("body") or " ").strip() or " "
                cimg = c.get("imageDataUrl")
                cimg_s = str(cimg) if isinstance(cimg, str) and cimg else None
                bind.execute(
                    text(
                        "INSERT INTO person_lore_card (id, event_id, kind, title, body, image_data_url, sort_order) "
                        "VALUES (gen_random_uuid(), :eid, :kind, :title, :body, :cimg, :ord)"
                    ),
                    {"eid": eid, "kind": kind, "title": t, "body": body, "cimg": cimg_s, "ord": i},
                )

        callouts = prof.get("loreCallouts") or []
        if isinstance(callouts, list):
            for i, c in enumerate(callouts):
                if not isinstance(c, dict):
                    continue
                t = str(c.get("title") or "").strip()
                body = str(c.get("body") or " ").strip() or " "
                if not t:
                    continue
                bind.execute(
                    text(
                        "INSERT INTO person_lore_callout (id, event_id, title, body, sort_order) "
                        "VALUES (gen_random_uuid(), :eid, :title, :body, :ord)"
                    ),
                    {"eid": eid, "title": t, "body": body, "ord": i},
                )

        flinks = prof.get("familyLinks") or []
        if isinstance(flinks, list):
            for link in flinks:
                if not isinstance(link, dict):
                    continue
                rel = str(link.get("relation") or "")
                pid = link.get("personEventId")
                if not rel or not pid:
                    continue
                try:
                    lid = PyUUID(str(pid).strip())
                except ValueError:
                    continue
                bind.execute(
                    text(
                        "INSERT INTO person_lore_family_link (id, event_id, relation, linked_person_event_id) "
                        "VALUES (gen_random_uuid(), :eid, :rel, :lid)"
                    ),
                    {"eid": eid, "rel": rel, "lid": lid},
                )

    op.drop_table("person_profiles")


def downgrade() -> None:
    op.create_table(
        "person_profiles",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.drop_index("ix_person_lore_family_link_linked", table_name="person_lore_family_link")
    op.drop_index("ix_person_lore_family_link_event_id", table_name="person_lore_family_link")
    op.drop_table("person_lore_family_link")
    op.drop_index("ix_person_lore_callout_event_id", table_name="person_lore_callout")
    op.drop_table("person_lore_callout")
    op.drop_index("ix_person_lore_card_event_id", table_name="person_lore_card")
    op.drop_table("person_lore_card")
    op.drop_index("ix_person_lore_scripture_event_id", table_name="person_lore_scripture")
    op.drop_table("person_lore_scripture")
    op.drop_table("person_lore_detail")
