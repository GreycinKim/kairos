from datetime import date
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Theme, ThemeTag


async def replace_theme_tags(
    db: AsyncSession,
    *,
    source_type: str,
    source_id: UUID,
    theme_ids: list[UUID],
    tagged_on: date | None = None,
) -> None:
    when = tagged_on or date.today()
    await db.execute(
        delete(ThemeTag).where(
            ThemeTag.source_type == source_type,
            ThemeTag.source_id == source_id,
        )
    )
    for tid in theme_ids:
        db.add(
            ThemeTag(
                theme_id=tid,
                source_type=source_type,
                source_id=source_id,
                tagged_on=when,
            )
        )


async def load_themes_for_source(
    db: AsyncSession,
    source_type: str,
    source_id: UUID,
):
    result = await db.execute(
        select(Theme)
        .join(ThemeTag, ThemeTag.theme_id == Theme.id)
        .where(ThemeTag.source_type == source_type, ThemeTag.source_id == source_id)
    )
    return list(result.scalars().all())


async def batch_themes_by_source(
    db: AsyncSession,
    source_type: str,
    source_ids: list[UUID],
) -> dict[UUID, list[Theme]]:
    if not source_ids:
        return {}
    result = await db.execute(
        select(ThemeTag, Theme)
        .join(Theme, Theme.id == ThemeTag.theme_id)
        .where(ThemeTag.source_type == source_type, ThemeTag.source_id.in_(source_ids))
    )
    out: dict[UUID, list[Theme]] = {i: [] for i in source_ids}
    for tt, th in result.all():
        out[tt.source_id].append(th)
    return out
