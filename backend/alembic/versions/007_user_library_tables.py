"""reading log + person_profiles + place_records (DB-backed library data)

Revision ID: 007
Revises: 006
Create Date: 2026-04-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reading_log_entries",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("book", sa.Text(), nullable=False),
        sa.Column("chapter", sa.Integer(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reading_log_entries_read_at", "reading_log_entries", ["read_at"])

    op.create_table(
        "person_profiles",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )

    op.create_table(
        "place_records",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("place", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("place_records")
    op.drop_table("person_profiles")
    op.drop_index("ix_reading_log_entries_read_at", table_name="reading_log_entries")
    op.drop_table("reading_log_entries")
