"""Static reader hub payload (book list, glossary snippets, recitation cards) — no external JBCH scraping."""

from app.schemas.jbch_hub import JbchHubRead
from app.services.jbch_default import default_hub_overlay


def get_reader_hub_read() -> JbchHubRead:
    idx, dic, rec, cards = default_hub_overlay()
    return JbchHubRead(
        fetched_at=None,
        note=None,
        index=idx,
        dictionary=dic,
        recitation_page=rec,
        recitation_cards=cards,
    )
