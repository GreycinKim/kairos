from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.workspace_client_state import WorkspaceClientState
from app.schemas.workspace import WorkspaceClientStatePut, WorkspaceClientStateRead

router = APIRouter(prefix="/workspace", tags=["workspace"])

DEFAULT_KEY = "default"


def _empty_state_row(key: str) -> WorkspaceClientState:
    return WorkspaceClientState(
        workspace_key=key,
        people_profiles={},
        places={},
        event_display={},
        event_scripture={},
        atlas_routes=[],
    )


async def _get_or_create_row(db: AsyncSession) -> WorkspaceClientState:
    row = await db.get(WorkspaceClientState, DEFAULT_KEY)
    if not row:
        row = _empty_state_row(DEFAULT_KEY)
        db.add(row)
        await db.flush()
        await db.refresh(row)
    return row


@router.get("/client-state", response_model=WorkspaceClientStateRead)
async def get_client_state(db: AsyncSession = Depends(get_db)) -> WorkspaceClientState:
    return await _get_or_create_row(db)


@router.put("/client-state", response_model=WorkspaceClientStateRead)
async def put_client_state(body: WorkspaceClientStatePut, db: AsyncSession = Depends(get_db)) -> WorkspaceClientState:
    row = await _get_or_create_row(db)
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(row, field, value)
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return row
