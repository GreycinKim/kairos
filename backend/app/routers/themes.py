from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import JournalEntry, Note, Prayer, Theme, ThemeTag
from app.schemas.themes import ThemeCreate, ThemeInsights, ThemeRead, ThemeTagRead, ThemeUpdate

router = APIRouter(prefix="/themes", tags=["themes"])


@router.get("", response_model=list[ThemeRead])
async def list_themes(db: AsyncSession = Depends(get_db)) -> list[Theme]:
    result = await db.execute(select(Theme).order_by(Theme.name))
    return list(result.scalars().all())


@router.get("/{theme_id}", response_model=ThemeRead)
async def get_theme(theme_id: UUID, db: AsyncSession = Depends(get_db)) -> Theme:
    row = await db.get(Theme, theme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")
    return row


@router.get("/{theme_id}/insights", response_model=ThemeInsights)
async def theme_insights(theme_id: UUID, db: AsyncSession = Depends(get_db)) -> ThemeInsights:
    row = await db.get(Theme, theme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")
    today = date.today()
    d30 = today - timedelta(days=30)
    d90 = today - timedelta(days=90)

    c30 = await db.scalar(
        select(func.count())
        .select_from(ThemeTag)
        .where(ThemeTag.theme_id == theme_id, ThemeTag.tagged_on >= d30)
    )
    c90 = await db.scalar(
        select(func.count())
        .select_from(ThemeTag)
        .where(ThemeTag.theme_id == theme_id, ThemeTag.tagged_on >= d90)
    )
    call = await db.scalar(
        select(func.count()).select_from(ThemeTag).where(ThemeTag.theme_id == theme_id)
    )
    label = f"You've tagged “{row.name}” {c30 or 0} times in the last 30 days."
    return ThemeInsights(
        count_30=int(c30 or 0),
        count_90=int(c90 or 0),
        count_all=int(call or 0),
        label=label,
    )


@router.get("/{theme_id}/tags", response_model=list[ThemeTagRead])
async def list_theme_tags(
    theme_id: UUID,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(40, le=200),
) -> list[ThemeTag]:
    row = await db.get(Theme, theme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")
    result = await db.execute(
        select(ThemeTag)
        .where(ThemeTag.theme_id == theme_id)
        .order_by(ThemeTag.tagged_on.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.get("/{theme_id}/mentions", response_model=list[dict])
async def theme_mentions(theme_id: UUID, db: AsyncSession = Depends(get_db), limit: int = Query(30, le=100)) -> list[dict]:
    row = await db.get(Theme, theme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")
    result = await db.execute(
        select(ThemeTag)
        .where(ThemeTag.theme_id == theme_id)
        .order_by(ThemeTag.tagged_on.desc())
        .limit(limit)
    )
    tags = list(result.scalars().all())
    out: list[dict] = []
    for tt in tags:
        title = ""
        if tt.source_type == "note":
            n = await db.get(Note, tt.source_id)
            title = (n.title or "Note") if n else "?"
        elif tt.source_type == "journal":
            j = await db.get(JournalEntry, tt.source_id)
            title = (j.title or "Journal") if j else "?"
        elif tt.source_type == "prayer":
            p = await db.get(Prayer, tt.source_id)
            title = (p.title or "Prayer") if p else "?"
        else:
            title = tt.source_type
        out.append(
            {
                "source_type": tt.source_type,
                "source_id": str(tt.source_id),
                "tagged_on": tt.tagged_on.isoformat(),
                "title": title,
            }
        )
    return out


@router.post("", response_model=ThemeRead, status_code=201)
async def create_theme(body: ThemeCreate, db: AsyncSession = Depends(get_db)) -> Theme:
    dup = (await db.execute(select(Theme).where(Theme.name == body.name))).scalar_one_or_none()
    if dup:
        raise HTTPException(status_code=409, detail="Theme name exists")
    t = Theme(**body.model_dump())
    db.add(t)
    await db.flush()
    await db.refresh(t)
    return t


@router.patch("/{theme_id}", response_model=ThemeRead)
async def update_theme(theme_id: UUID, body: ThemeUpdate, db: AsyncSession = Depends(get_db)) -> Theme:
    row = await db.get(Theme, theme_id)
    if not row:
        raise HTTPException(status_code=404, detail="Theme not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/{theme_id}", status_code=204)
async def delete_theme(theme_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(Theme).where(Theme.id == theme_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Theme not found")
