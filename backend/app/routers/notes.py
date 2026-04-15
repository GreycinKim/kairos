from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Note, NoteLink, Tag
from app.schemas.notes import (
    NoteCreate,
    NoteLinkCreate,
    NoteLinkRead,
    NoteRead,
    NoteUpdate,
    TagCreate,
    TagRead,
)
from app.schemas.themes import ThemeSnippet
from app.services.theme_tags import batch_themes_by_source, replace_theme_tags

router = APIRouter(prefix="/notes", tags=["notes"])
tags_router = APIRouter(prefix="/tags", tags=["tags"])


async def _load_note(db: AsyncSession, note_id: UUID) -> Note | None:
    result = await db.execute(select(Note).where(Note.id == note_id).options(selectinload(Note.tags)))
    return result.scalar_one_or_none()


async def _note_reads(db: AsyncSession, notes: list[Note]) -> list[NoteRead]:
    if not notes:
        return []
    ids = [n.id for n in notes]
    tmap = await batch_themes_by_source(db, "note", ids)
    return [
        NoteRead(
            id=n.id,
            event_id=n.event_id,
            title=n.title,
            body=n.body,
            is_private=n.is_private,
            created_at=n.created_at,
            updated_at=n.updated_at,
            tags=[TagRead.model_validate(t) for t in n.tags],
            themes=[ThemeSnippet.model_validate(t) for t in tmap.get(n.id, [])],
        )
        for n in notes
    ]


@tags_router.get("", response_model=list[TagRead])
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[Tag]:
    result = await db.execute(select(Tag).order_by(Tag.name))
    return list(result.scalars().all())


@tags_router.post("", response_model=TagRead, status_code=201)
async def create_tag(body: TagCreate, db: AsyncSession = Depends(get_db)) -> Tag:
    dup = (await db.execute(select(Tag).where(Tag.name == body.name))).scalar_one_or_none()
    if dup:
        raise HTTPException(status_code=409, detail="Tag name already exists")
    t = Tag(**body.model_dump())
    db.add(t)
    await db.flush()
    await db.refresh(t)
    return t


@tags_router.delete("/{tag_id}", status_code=204)
async def delete_tag(tag_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(Tag).where(Tag.id == tag_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tag not found")


@router.get("", response_model=list[NoteRead])
async def list_notes(
    db: AsyncSession = Depends(get_db),
    tag_id: UUID | None = Query(None),
) -> list[NoteRead]:
    q = select(Note).options(selectinload(Note.tags)).order_by(Note.updated_at.desc())
    if tag_id:
        q = q.join(Note.tags).where(Tag.id == tag_id)
    result = await db.execute(q)
    notes = list(result.scalars().unique().all())
    return await _note_reads(db, notes)


@router.get("/by-event/{event_id}", response_model=list[NoteRead])
async def notes_for_event(event_id: UUID, db: AsyncSession = Depends(get_db)) -> list[NoteRead]:
    result = await db.execute(
        select(Note).where(Note.event_id == event_id).options(selectinload(Note.tags)).order_by(Note.updated_at.desc())
    )
    notes = list(result.scalars().all())
    return await _note_reads(db, notes)


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(note_id: UUID, db: AsyncSession = Depends(get_db)) -> NoteRead:
    n = await _load_note(db, note_id)
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    return (await _note_reads(db, [n]))[0]


@router.post("", response_model=NoteRead, status_code=201)
async def create_note(body: NoteCreate, db: AsyncSession = Depends(get_db)) -> NoteRead:
    data = body.model_dump()
    tag_ids = data.pop("tag_ids", None) or []
    theme_ids = data.pop("theme_ids", None) or []
    n = Note(**data)
    if tag_ids:
        for tid in tag_ids:
            t = await db.get(Tag, tid)
            if t:
                n.tags.append(t)
    db.add(n)
    await db.flush()
    await db.refresh(n, ["tags"])
    await replace_theme_tags(db, source_type="note", source_id=n.id, theme_ids=theme_ids)
    return (await _note_reads(db, [n]))[0]


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(note_id: UUID, body: NoteUpdate, db: AsyncSession = Depends(get_db)) -> NoteRead:
    n = await _load_note(db, note_id)
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    data = body.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    theme_ids = data.pop("theme_ids", None)
    data.pop("themes", None)
    for k, v in data.items():
        setattr(n, k, v)
    if tag_ids is not None:
        n.tags.clear()
        for tid in tag_ids:
            t = await db.get(Tag, tid)
            if t:
                n.tags.append(t)
    await db.flush()
    await db.refresh(n, ["tags"])
    if theme_ids is not None:
        await replace_theme_tags(db, source_type="note", source_id=n.id, theme_ids=theme_ids)
    return (await _note_reads(db, [n]))[0]


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(Note).where(Note.id == note_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")


links_router = APIRouter(prefix="/note-links", tags=["note-links"])


@links_router.get("", response_model=list[NoteLinkRead])
async def list_links(db: AsyncSession = Depends(get_db)) -> list[NoteLink]:
    result = await db.execute(select(NoteLink))
    return list(result.scalars().all())


@links_router.post("", response_model=NoteLinkRead, status_code=201)
async def create_link(body: NoteLinkCreate, db: AsyncSession = Depends(get_db)) -> NoteLink:
    link = NoteLink(**body.model_dump())
    db.add(link)
    await db.flush()
    await db.refresh(link)
    return link


@links_router.delete("/{link_id}", status_code=204)
async def delete_link(link_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(NoteLink).where(NoteLink.id == link_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Link not found")
