"""Load/save person lore as normalized rows while exposing the same JSON shape the React app uses."""

from __future__ import annotations

import asyncio
from typing import Any
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.person_lore import (
    PersonLoreCalloutRow,
    PersonLoreCardRow,
    PersonLoreDetail,
    PersonLoreFamilyLinkRow,
    PersonLoreScriptureRow,
)


def _uuid(s: str) -> UUID | None:
    try:
        return UUID(str(s).strip())
    except ValueError:
        return None


def _int_year(v: Any) -> int | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float) and v == int(v):
        return int(v)
    return None


def profile_dict_from_db(
    detail: PersonLoreDetail,
    scriptures: list[PersonLoreScriptureRow],
    cards: list[PersonLoreCardRow],
    callouts: list[PersonLoreCalloutRow],
    links: list[PersonLoreFamilyLinkRow],
) -> dict[str, Any]:
    eid = str(detail.event_id)
    out: dict[str, Any] = {
        "eventId": eid,
        "name": detail.name or "",
        "scope": detail.scope if detail.scope in ("bible", "church_history") else "bible",
        "figureKind": detail.figure_kind,
        "title": detail.title,
        "biography": detail.biography,
        "diedYear": detail.died_year,
        "ruledFromYear": detail.ruled_from_year,
        "ruledToYear": detail.ruled_to_year,
        "hidden": bool(detail.hidden),
        "imageDataUrl": detail.image_data_url,
        "scriptureAppearances": [{"book": r.book, "chapter": r.chapter} for r in sorted(scriptures, key=lambda x: x.sort_order)],
        "loreCards": [
            {
                "kind": r.kind,
                "title": r.title,
                "body": r.body,
                **({"imageDataUrl": r.image_data_url} if r.image_data_url else {}),
            }
            for r in sorted(cards, key=lambda x: x.sort_order)
        ],
        "loreCallouts": [{"title": r.title, "body": r.body} for r in sorted(callouts, key=lambda x: x.sort_order)],
        "familyLinks": [
            {"relation": r.relation, "personEventId": str(r.linked_person_event_id)} for r in links
        ],
    }
    rel = detail.related_event_ids
    if isinstance(rel, list) and rel:
        out["relatedEventIds"] = [str(x) for x in rel]
    if detail.atlas_catalog_map_id and detail.atlas_nx is not None and detail.atlas_ny is not None:
        out["atlasPin"] = {
            "catalogMapId": detail.atlas_catalog_map_id,
            "nx": float(detail.atlas_nx),
            "ny": float(detail.atlas_ny),
        }
    return out


async def load_profile_map(db: AsyncSession) -> dict[str, Any]:
    details = list((await db.execute(select(PersonLoreDetail))).scalars().all())
    if not details:
        return {}
    ids = [d.event_id for d in details]
    scriptures = list((await db.execute(select(PersonLoreScriptureRow).where(PersonLoreScriptureRow.event_id.in_(ids)))).scalars().all())
    cards = list((await db.execute(select(PersonLoreCardRow).where(PersonLoreCardRow.event_id.in_(ids)))).scalars().all())
    callouts = list((await db.execute(select(PersonLoreCalloutRow).where(PersonLoreCalloutRow.event_id.in_(ids)))).scalars().all())
    links = list((await db.execute(select(PersonLoreFamilyLinkRow).where(PersonLoreFamilyLinkRow.event_id.in_(ids)))).scalars().all())

    by_s: dict[UUID, list[PersonLoreScriptureRow]] = {}
    by_c: dict[UUID, list[PersonLoreCardRow]] = {}
    by_co: dict[UUID, list[PersonLoreCalloutRow]] = {}
    by_l: dict[UUID, list[PersonLoreFamilyLinkRow]] = {}
    for r in scriptures:
        by_s.setdefault(r.event_id, []).append(r)
    for r in cards:
        by_c.setdefault(r.event_id, []).append(r)
    for r in callouts:
        by_co.setdefault(r.event_id, []).append(r)
    for r in links:
        by_l.setdefault(r.event_id, []).append(r)

    out: dict[str, Any] = {}
    for d in details:
        eid = str(d.event_id)
        out[eid] = profile_dict_from_db(d, by_s.get(d.event_id, []), by_c.get(d.event_id, []), by_co.get(d.event_id, []), by_l.get(d.event_id, []))
    return out


async def load_one_profile(db: AsyncSession, event_id: UUID) -> dict[str, Any] | None:
    detail = await db.get(PersonLoreDetail, event_id)
    if not detail:
        return None
    scriptures = list(
        (await db.execute(select(PersonLoreScriptureRow).where(PersonLoreScriptureRow.event_id == event_id))).scalars().all()
    )
    cards = list((await db.execute(select(PersonLoreCardRow).where(PersonLoreCardRow.event_id == event_id))).scalars().all())
    callouts = list((await db.execute(select(PersonLoreCalloutRow).where(PersonLoreCalloutRow.event_id == event_id))).scalars().all())
    links = list((await db.execute(select(PersonLoreFamilyLinkRow).where(PersonLoreFamilyLinkRow.event_id == event_id))).scalars().all())
    return profile_dict_from_db(detail, scriptures, cards, callouts, links)


async def _delete_children(db: AsyncSession, event_id: UUID) -> None:
    await db.execute(delete(PersonLoreScriptureRow).where(PersonLoreScriptureRow.event_id == event_id))
    await db.execute(delete(PersonLoreCardRow).where(PersonLoreCardRow.event_id == event_id))
    await db.execute(delete(PersonLoreCalloutRow).where(PersonLoreCalloutRow.event_id == event_id))
    await db.execute(delete(PersonLoreFamilyLinkRow).where(PersonLoreFamilyLinkRow.event_id == event_id))


async def save_profile_dict(
    db: AsyncSession,
    event_id: UUID,
    prof: dict[str, Any],
    *,
    hydrate_response: bool = True,
    flush: bool = True,
) -> dict[str, Any]:
    """Replace normalized rows for this event from a client PersonProfile-shaped dict."""
    name = str(prof.get("name") or "").strip() or "Unknown"
    scope_raw = prof.get("scope")
    scope = scope_raw if scope_raw in ("bible", "church_history") else "bible"
    figure_kind = prof.get("figureKind")
    if figure_kind is not None:
        figure_kind = str(figure_kind)
    title = prof.get("title")
    if title is not None:
        title = str(title)
    biography = prof.get("biography")
    if biography is not None:
        biography = str(biography)
    died = _int_year(prof.get("diedYear"))
    ruled_from = _int_year(prof.get("ruledFromYear"))
    ruled_to = _int_year(prof.get("ruledToYear"))
    hidden = bool(prof.get("hidden"))
    image_data_url = prof.get("imageDataUrl")
    if image_data_url is not None and not isinstance(image_data_url, str):
        image_data_url = str(image_data_url) if image_data_url else None

    pin = prof.get("atlasPin")
    cat_id = nx = ny = None
    if isinstance(pin, dict):
        cid = pin.get("catalogMapId")
        if isinstance(cid, str) and cid.strip():
            cat_id = cid.strip()
            try:
                nx = float(pin.get("nx"))
                ny = float(pin.get("ny"))
            except (TypeError, ValueError):
                cat_id = nx = ny = None

    rel_ids = prof.get("relatedEventIds")
    if not isinstance(rel_ids, list):
        rel_ids = []

    detail = await db.get(PersonLoreDetail, event_id)
    if detail is None:
        detail = PersonLoreDetail(event_id=event_id)
        db.add(detail)

    detail.name = name
    detail.scope = scope
    detail.figure_kind = figure_kind
    detail.title = title
    detail.biography = biography
    detail.died_year = died
    detail.ruled_from_year = ruled_from
    detail.ruled_to_year = ruled_to
    detail.hidden = hidden
    detail.image_data_url = image_data_url if isinstance(image_data_url, str) else None
    detail.atlas_catalog_map_id = cat_id
    detail.atlas_nx = nx
    detail.atlas_ny = ny
    detail.related_event_ids = rel_ids

    await _delete_children(db, event_id)

    srows = prof.get("scriptureAppearances") or []
    if isinstance(srows, list):
        for i, row in enumerate(srows):
            if not isinstance(row, dict):
                continue
            book = str(row.get("book") or "").strip()
            ch = row.get("chapter")
            if not book or not isinstance(ch, (int, float)):
                continue
            db.add(
                PersonLoreScriptureRow(
                    event_id=event_id,
                    book=book,
                    chapter=int(ch),
                    sort_order=i,
                )
            )

    cards = prof.get("loreCards") or []
    if isinstance(cards, list):
        for i, c in enumerate(cards):
            if not isinstance(c, dict):
                continue
            kind = str(c.get("kind") or "event")
            t = str(c.get("title") or "").strip()
            body = str(c.get("body") or " ").strip() or " "
            img = c.get("imageDataUrl")
            img_s = str(img) if isinstance(img, str) and img else None
            db.add(
                PersonLoreCardRow(
                    event_id=event_id,
                    kind=kind,
                    title=t,
                    body=body,
                    image_data_url=img_s,
                    sort_order=i,
                )
            )

    callouts = prof.get("loreCallouts") or []
    if isinstance(callouts, list):
        for i, c in enumerate(callouts):
            if not isinstance(c, dict):
                continue
            t = str(c.get("title") or "").strip()
            body = str(c.get("body") or " ").strip() or " "
            if not t:
                continue
            db.add(PersonLoreCalloutRow(event_id=event_id, title=t, body=body, sort_order=i))

    flinks = prof.get("familyLinks") or []
    if isinstance(flinks, list):
        for link in flinks:
            if not isinstance(link, dict):
                continue
            rel = str(link.get("relation") or "")
            pid = link.get("personEventId")
            uid = _uuid(str(pid)) if pid else None
            if not rel or uid is None:
                continue
            db.add(PersonLoreFamilyLinkRow(event_id=event_id, relation=rel, linked_person_event_id=uid))

    if flush:
        await db.flush()
    if hydrate_response:
        return (await load_one_profile(db, event_id)) or {}
    return {**prof, "eventId": str(event_id)}


async def save_all_profiles(db: AsyncSession, profiles: dict[str, Any]) -> dict[str, Any]:
    """Replace the entire corpus: upsert each profile, delete people not in the map."""
    if not profiles:
        await db.execute(delete(PersonLoreDetail))
        await db.flush()
        return {}

    incoming: set[UUID] = set()
    saved_profiles: dict[str, Any] = {}
    # Keep the event loop responsive and avoid one giant flush for large imports.
    flush_every = 25
    saved_count = 0
    for event_id_str in profiles:
        uid = _uuid(event_id_str)
        if uid is None:
            continue
        prof = profiles[event_id_str]
        if not isinstance(prof, dict):
            continue
        saved = await save_profile_dict(db, uid, prof, hydrate_response=False, flush=False)
        incoming.add(uid)
        saved_profiles[str(uid)] = saved
        saved_count += 1
        if saved_count % flush_every == 0:
            await db.flush()
            await asyncio.sleep(0)

    if incoming:
        await db.execute(delete(PersonLoreDetail).where(~PersonLoreDetail.event_id.in_(incoming)))

    await db.flush()
    return saved_profiles
