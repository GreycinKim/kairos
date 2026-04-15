from fastapi import APIRouter

from app.schemas.jbch_hub import JbchHubRead
from app.services.reader_hub_inhouse import get_reader_hub_read

router = APIRouter(prefix="/jbch-hub", tags=["reader-hub"])


@router.get("", response_model=JbchHubRead)
async def get_reader_hub() -> JbchHubRead:
    """In-house reader metadata (no external portal scrape)."""
    return get_reader_hub_read()
