"""prayer scripture themes timeline fields

Revision ID: 002
Revises: 001
Create Date: 2026-04-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("timeline_events", sa.Column("era", sa.Text(), nullable=True))
    op.add_column("timeline_events", sa.Column("author", sa.Text(), nullable=True))
    op.add_column("timeline_events", sa.Column("written_start_year", sa.Integer(), nullable=True))
    op.add_column("timeline_events", sa.Column("written_end_year", sa.Integer(), nullable=True))
    op.drop_column("timeline_events", "genre")

    op.create_table(
        "themes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("color", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "theme_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("theme_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tagged_on", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["theme_id"], ["themes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_theme_tags_source", "theme_tags", ["source_type", "source_id"])

    op.create_table(
        "prayers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default="waiting"),
        sa.Column("prayed_on", sa.Date(), nullable=False),
        sa.Column("answered_on", sa.Date(), nullable=True),
        sa.Column("answer_notes", sa.Text(), nullable=True),
        sa.Column("linked_event_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["linked_event_id"], ["timeline_events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "scripture_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("book", sa.Text(), nullable=False),
        sa.Column("chapter", sa.Integer(), nullable=False),
        sa.Column("verse_start", sa.Integer(), nullable=False),
        sa.Column("verse_end", sa.Integer(), nullable=True),
        sa.Column("translation", sa.Text(), server_default="WEB"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scripture_links_book_chapter", "scripture_links", ["book", "chapter"])


def downgrade() -> None:
    op.drop_index("ix_scripture_links_book_chapter", table_name="scripture_links")
    op.drop_table("scripture_links")
    op.drop_table("prayers")
    op.drop_index("ix_theme_tags_source", table_name="theme_tags")
    op.drop_table("theme_tags")
    op.drop_table("themes")

    op.add_column("timeline_events", sa.Column("genre", sa.Text(), nullable=True))
    op.drop_column("timeline_events", "written_end_year")
    op.drop_column("timeline_events", "written_start_year")
    op.drop_column("timeline_events", "author")
    op.drop_column("timeline_events", "era")
