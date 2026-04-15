from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Note, WordStudy, word_study_links
from app.schemas.word_study import WordStudyCreate, WordStudyFromReaderCreate, WordStudyRead, WordStudyUpdate
from app.services.blb_links import markdown_links_for_word

router = APIRouter(prefix="/word-studies", tags=["word-studies"])


@router.get("", response_model=list[WordStudyRead])
async def list_word_studies(db: AsyncSession = Depends(get_db)) -> list[WordStudy]:
    result = await db.execute(select(WordStudy).order_by(WordStudy.word))
    return list(result.scalars().all())


@router.get("/{study_id}", response_model=WordStudyRead)
async def get_word_study(study_id: UUID, db: AsyncSession = Depends(get_db)) -> WordStudy:
    row = await db.get(WordStudy, study_id)
    if not row:
        raise HTTPException(status_code=404, detail="Word study not found")
    return row


@router.post("", response_model=WordStudyRead, status_code=201)
async def create_word_study(body: WordStudyCreate, db: AsyncSession = Depends(get_db)) -> WordStudy:
    ws = WordStudy(**body.model_dump())
    db.add(ws)
    await db.flush()
    await db.refresh(ws)
    return ws


@router.post("/from-reader", response_model=WordStudyRead, status_code=201)
async def create_word_study_from_reader(
    body: WordStudyFromReaderCreate, db: AsyncSession = Depends(get_db)
) -> WordStudy:
    """Save a lexical lookup with BLB links and the current verse as the first reference."""
    t = body.translation.strip().upper()
    ref = f"{body.book.strip()} {body.chapter}:{body.verse}"
    notes = markdown_links_for_word(
        word=body.word.strip(),
        book=body.book.strip(),
        chapter=body.chapter,
        verse=body.verse,
        translation=t,
    )
    ws = WordStudy(
        word=body.word.strip(),
        transliteration=None,
        language="lookup",
        strongs_number=None,
        definition=(
            f"Saved from Kairos reader at {ref} ({t}). "
            "Follow the Blue Letter Bible links in notes for Greek/Hebrew, concordance, and cross-references."
        ),
        extended_notes=notes,
        verse_references=[ref],
    )
    db.add(ws)
    await db.flush()
    await db.refresh(ws)
    return ws


@router.patch("/{study_id}", response_model=WordStudyRead)
async def update_word_study(
    study_id: UUID, body: WordStudyUpdate, db: AsyncSession = Depends(get_db)
) -> WordStudy:
    row = await db.get(WordStudy, study_id)
    if not row:
        raise HTTPException(status_code=404, detail="Word study not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/{study_id}", status_code=204)
async def delete_word_study(study_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(WordStudy).where(WordStudy.id == study_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Word study not found")


@router.post("/{study_id}/link-note/{note_id}", status_code=204)
async def link_note_to_study(study_id: UUID, note_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    ws = await db.get(WordStudy, study_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Word study not found")
    n = await db.get(Note, note_id)
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.execute(
        pg_insert(word_study_links)
        .values(word_study_id=study_id, note_id=note_id)
        .on_conflict_do_nothing()
    )
