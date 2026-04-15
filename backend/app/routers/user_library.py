from typing import Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
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


@router.get("/person-profiles/{event_id}")
async def get_one_person_profile(event_id: UUID, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Return the stored lore/profile JSON for one timeline person or ruler."""
    row = await db.get(PersonProfileRow, event_id)
    if not row:
        raise HTTPException(status_code=404, detail="No profile for this event id")
    return row.profile if isinstance(row.profile, dict) else {}


@router.put("/person-profiles/{event_id}")
async def put_one_person_profile(
    event_id: UUID,
    profile: dict[str, Any] = Body(
        ...,
        description="Full or partial profile object; merged with `eventId` and upserted for this event only.",
    ),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Upsert a single person profile without replacing other people (same JSONB shape as bulk map values)."""
    if not isinstance(profile, dict):
        raise HTTPException(status_code=400, detail="Body must be a JSON object")
    merged = {**profile, "eventId": str(event_id)}
    row = await db.get(PersonProfileRow, event_id)
    if row is None:
        db.add(PersonProfileRow(event_id=event_id, profile=merged))
    else:
        row.profile = merged
    await db.flush()
    await db.refresh(row)
    return row.profile if isinstance(row.profile, dict) else {}


@router.put("/person-profiles", response_model=PersonProfilesRead)
async def put_person_profiles(body: PersonProfilesPut, db: AsyncSession = Depends(get_db)) -> PersonProfilesRead:
    """
    Replace all person profiles with the given map: upsert each id, then delete rows not present in the map.
    Safer than delete-all-then-insert (avoids empty table if insert fails mid-way).
    """
    incoming = body.profiles or {}
    if not incoming:
        await db.execute(delete(PersonProfileRow))
        await db.flush()
        return PersonProfilesRead(profiles={})

    incoming_keys: set[str] = set()
    for event_id_str, profile in incoming.items():
        uid = _parse_uuid(event_id_str)
        if uid is None:
            continue
        if not isinstance(profile, dict):
            continue
        merged = {**profile, "eventId": str(uid)}
        row = await db.get(PersonProfileRow, uid)
        if row is None:
            db.add(PersonProfileRow(event_id=uid, profile=merged))
        else:
            row.profile = merged
        incoming_keys.add(str(uid))

    result = await db.execute(select(PersonProfileRow))
    for row in list(result.scalars().all()):
        if str(row.event_id) not in incoming_keys:
            await db.delete(row)

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
