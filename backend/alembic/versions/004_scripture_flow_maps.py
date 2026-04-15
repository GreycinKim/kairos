"""scripture flow maps (sermon notes + interactive graph)

Revision ID: 004
Revises: 003
Create Date: 2026-04-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scripture_flow_maps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.Text(), server_default="Untitled map", nullable=False),
        sa.Column("notes_markdown", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "graph_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{\"nodes\": [], \"edges\": []}'::jsonb"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("scripture_flow_maps")
