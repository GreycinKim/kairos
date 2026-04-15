"""reader highlights and verse notes

Revision ID: 003
Revises: 002
Create Date: 2026-04-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reader_highlights",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("book", sa.Text(), nullable=False),
        sa.Column("chapter", sa.Integer(), nullable=False),
        sa.Column("verse", sa.Integer(), nullable=False),
        sa.Column("translation", sa.Text(), server_default="ESV", nullable=False),
        sa.Column("start_offset", sa.Integer(), nullable=False),
        sa.Column("end_offset", sa.Integer(), nullable=False),
        sa.Column("color", sa.Text(), server_default="#fef08a", nullable=False),
        sa.Column("highlighted_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_reader_highlights_loc",
        "reader_highlights",
        ["book", "chapter", "translation"],
    )

    op.create_table(
        "reader_verse_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("book", sa.Text(), nullable=False),
        sa.Column("chapter", sa.Integer(), nullable=False),
        sa.Column("verse", sa.Integer(), nullable=False),
        sa.Column("translation", sa.Text(), server_default="ESV", nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_reader_verse_notes_loc",
        "reader_verse_notes",
        ["book", "chapter", "translation"],
    )


def downgrade() -> None:
    op.drop_index("ix_reader_verse_notes_loc", table_name="reader_verse_notes")
    op.drop_table("reader_verse_notes")
    op.drop_index("ix_reader_highlights_loc", table_name="reader_highlights")
    op.drop_table("reader_highlights")
