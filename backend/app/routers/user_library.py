from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user_library import PersonProfileRow, PlaceRecordRow
from app.schemas.user_library import PersonProfilesPut, PersonProfilesRead, PlaceRecordsPut, PlaceRecordsRead

router = APIRouter(prefix="/library", tags=["library"])


def _parse_uuid(key: str) -> UUID | None:
    try:
        return UUID(key.strip())
    except ValueError:
        return None


@router.get("/person-profiles", response_model=PersonProfilesRead)
async def get_person_profiles(db: AsyncSession = Depends(get_db)) -> PersonProfilesRead:
    result = await db.execute(select(PersonProfileRow))
    rows = list(result.scalars().all())
    profiles: dict[str, Any] = {}
    for r in rows:
        profiles[str(r.event_id)] = r.profile if isinstance(r.profile, dict) else {}
    return PersonProfilesRead(profiles=profiles)


@router.put("/person-profiles", response_model=PersonProfilesRead)
async def put_person_profiles(body: PersonProfilesPut, db: AsyncSession = Depends(get_db)) -> PersonProfilesRead:
    await db.execute(delete(PersonProfileRow))
    await db.flush()
    for event_id_str, profile in (body.profiles or {}).items():
        uid = _parse_uuid(event_id_str)
        if uid is None:
            continue
        if not isinstance(profile, dict):
            continue
        merged = {**profile, "eventId": str(uid)}
        db.add(PersonProfileRow(event_id=uid, profile=merged))
    await db.flush()
    return await get_person_profiles(db)


@router.get("/place-records", response_model=PlaceRecordsRead)
async def get_place_records(db: AsyncSession = Depends(get_db)) -> PlaceRecordsRead:
    result = await db.execute(select(PlaceRecordRow))
    rows = list(result.scalars().all())
    places: dict[str, Any] = {}
    for r in rows:
        places[r.id] = r.place if isinstance(r.place, dict) else {}
    return PlaceRecordsRead(places=places)


@router.put("/place-records", response_model=PlaceRecordsRead)
async def put_place_records(body: PlaceRecordsPut, db: AsyncSession = Depends(get_db)) -> PlaceRecordsRead:
    await db.execute(delete(PlaceRecordRow))
    await db.flush()
    for place_id, place in (body.places or {}).items():
        if not isinstance(place_id, str) or not place_id.strip():
            continue
        if not isinstance(place, dict):
            continue
        merged = {**place, "id": place_id.strip()}
        db.add(PlaceRecordRow(id=place_id.strip(), place=merged))
    await db.flush()
    return await get_place_records(db)
