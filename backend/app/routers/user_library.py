from typing import Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user_library import PlaceRecordRow
from app.schemas.user_library import PersonProfilesPut, PersonProfilesRead, PlaceRecordsPut, PlaceRecordsRead
from app.services.person_lore_store import load_one_profile, load_profile_map, save_all_profiles, save_profile_dict

router = APIRouter(prefix="/library", tags=["library"])


@router.get("/person-profiles", response_model=PersonProfilesRead)
async def get_person_profiles(db: AsyncSession = Depends(get_db)) -> PersonProfilesRead:
    profiles = await load_profile_map(db)
    return PersonProfilesRead(profiles=profiles)


@router.get("/person-profiles/{event_id}")
async def get_one_person_profile(event_id: UUID, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    row = await load_one_profile(db, event_id)
    if row is None:
        raise HTTPException(status_code=404, detail="No profile for this event id")
    return row


@router.put("/person-profiles/{event_id}")
async def put_one_person_profile(
    event_id: UUID,
    profile: dict[str, Any] = Body(
        ...,
        description="PersonProfile-shaped JSON; stored in normalized person_lore_* tables.",
    ),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")
    merged = {**profile, "eventId": str(event_id)}
    return await save_profile_dict(db, event_id, merged)


@router.put("/person-profiles", response_model=PersonProfilesRead)
async def put_person_profiles(body: PersonProfilesPut, db: AsyncSession = Depends(get_db)) -> PersonProfilesRead:
    profiles = await save_all_profiles(db, body.profiles or {})
    return PersonProfilesRead(profiles=profiles)


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
