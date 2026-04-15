from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ScriptureFlowFolder, ScriptureFlowMap, ScriptureLink
from app.schemas.scripture import (
    ChapterTextResponse,
    ScriptureLinkCreate,
    ScriptureLinkRead,
    ScriptureLinkUpdate,
    VerseTextResponse,
)
from app.schemas.scripture_flow_map import (
    FlowMapChapterIndexResponse,
    FlowMapEdgeHit,
    FlowMapVerseMention,
    FlowMapVerseRollup,
    ScriptureFlowFolderCreate,
    ScriptureFlowFolderRead,
    ScriptureFlowFolderUpdate,
    ScriptureFlowMapCreate,
    ScriptureFlowMapRead,
    ScriptureFlowMapUpdate,
)
from app.services.bible_versions import BibleTranslation, fetch_chapter, fetch_verse_text

router = APIRouter(prefix="/scripture", tags=["scripture"])


def _norm_reader_book(b: object) -> str:
    if not isinstance(b, str):
        return ""
    return b.strip().casefold()


def _parse_flow_graph_node(n: object) -> dict | None:
    if not isinstance(n, dict):
        return None
    nid = n.get("id")
    if not isinstance(nid, str):
        return None
    data = n.get("data")
    if not isinstance(data, dict):
        return None
    book = data.get("book")
    if not isinstance(book, str) or not book.strip():
        return None
    ch_raw = data.get("chapter")
    try:
        ch_i = int(ch_raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    vs_raw = data.get("verseStart")
    try:
        vs_i = int(vs_raw)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    ve_raw = data.get("verseEnd")
    if ve_raw is None or ve_raw == "":
        ve_i = vs_i
    else:
        try:
            ve_i = int(ve_raw)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            ve_i = vs_i
    if ve_i < vs_i:
        vs_i, ve_i = ve_i, vs_i
    lab = str(data.get("label") or "").strip()
    if not lab:
        lab = f"{book.strip()} {ch_i}:{vs_i}" + (f"–{ve_i}" if ve_i != vs_i else "")
    return {"id": nid, "book": book.strip(), "chapter": ch_i, "vs": vs_i, "ve": ve_i, "label": lab}


@router.get("/verse-text", response_model=VerseTextResponse)
async def verse_text(
    book: str = Query(..., description="e.g. John"),
    chapter: int = Query(..., ge=1),
    verse_start: int = Query(..., ge=1),
    verse_end: int | None = Query(None, ge=1),
    translation: BibleTranslation = Query(
        BibleTranslation.ESV,
        description="ESV, LSB, NKJV, or KJV",
    ),
) -> VerseTextResponse:
    ve = verse_end if verse_end is not None else verse_start
    vs, ve2 = (verse_start, ve) if verse_start <= ve else (ve, verse_start)
    return await fetch_verse_text(translation, book, chapter, vs, ve2)


@router.get("/chapter", response_model=ChapterTextResponse)
async def chapter_text(
    book: str = Query(..., description="e.g. Genesis"),
    chapter: int = Query(..., ge=1),
    translation: BibleTranslation = Query(
        BibleTranslation.ESV,
        description="ESV, LSB, NKJV, or KJV",
    ),
) -> ChapterTextResponse:
    """Whole chapter with per-verse text (bolls.life for ESV/LSB/NKJV; bible-api.com for KJV)."""
    return await fetch_chapter(translation, book, chapter)


@router.get("/links", response_model=list[ScriptureLinkRead])
async def list_links(db: AsyncSession = Depends(get_db)) -> list[ScriptureLink]:
    result = await db.execute(select(ScriptureLink).order_by(ScriptureLink.book, ScriptureLink.chapter, ScriptureLink.verse_start))
    return list(result.scalars().all())


@router.get("/links/at", response_model=list[ScriptureLinkRead])
async def links_at_verse(
    db: AsyncSession = Depends(get_db),
    book: str = Query(...),
    chapter: int = Query(...),
    verse: int = Query(...),
) -> list[ScriptureLink]:
    result = await db.execute(
        select(ScriptureLink).where(
            ScriptureLink.book.ilike(book.strip()),
            ScriptureLink.chapter == chapter,
        )
    )
    rows = list(result.scalars().all())
    out: list[ScriptureLink] = []
    for row in rows:
        end = row.verse_end or row.verse_start
        if row.verse_start <= verse <= end:
            out.append(row)
    return out


@router.get("/graph")
async def scripture_graph(
    db: AsyncSession = Depends(get_db),
    book: str = Query(...),
    chapter: int = Query(...),
    verse: int = Query(...),
) -> dict:
    """Verse node + sources at this verse + other verses those sources link to."""
    at = await links_at_verse(db=db, book=book, chapter=chapter, verse=verse)
    pairs: set[tuple[str, UUID]] = set()
    for link in at:
        pairs.add((link.source_type, link.source_id))

    if not pairs:
        return {
            "center": {"book": book, "chapter": chapter, "verse": verse},
            "nodes": [{"id": f"v:{book}:{chapter}:{verse}", "label": f"{book} {chapter}:{verse}", "kind": "verse"}],
            "edges": [],
        }

    conds = []
    for st, sid in pairs:
        conds.append((ScriptureLink.source_type == st) & (ScriptureLink.source_id == sid))
    q = select(ScriptureLink).where(or_(*conds))
    result = await db.execute(q)
    all_links = list(result.scalars().all())

    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    def vid(b: str, c: int, vs: int, ve: int | None) -> str:
        end = ve or vs
        return f"v:{b}:{c}:{vs}-{end}"

    center_id = vid(book, chapter, verse, verse)
    nodes[center_id] = {"id": center_id, "label": f"{book} {chapter}:{verse}", "kind": "verse"}

    for link in all_links:
        end = link.verse_end or link.verse_start
        nid = vid(link.book, link.chapter, link.verse_start, link.verse_end)
        label = f"{link.book} {link.chapter}:{link.verse_start}"
        if link.verse_end and link.verse_end != link.verse_start:
            label += f"–{link.verse_end}"
        nodes[nid] = {"id": nid, "label": label, "kind": "verse"}
        sid = f"s:{link.source_type}:{link.source_id}"
        if sid not in nodes:
            nodes[sid] = {
                "id": sid,
                "label": f"{link.source_type}:{str(link.source_id)[:8]}…",
                "kind": link.source_type,
            }
        edges.append({"from": sid, "to": nid, "source_type": link.source_type})

    return {"center": {"book": book, "chapter": chapter, "verse": verse}, "nodes": list(nodes.values()), "edges": edges}


@router.post("/links", response_model=ScriptureLinkRead, status_code=201)
async def create_link(body: ScriptureLinkCreate, db: AsyncSession = Depends(get_db)) -> ScriptureLink:
    data = body.model_dump()
    if not data.get("translation"):
        data["translation"] = "WEB"
    link = ScriptureLink(**data)
    db.add(link)
    await db.flush()
    await db.refresh(link)
    return link


@router.patch("/links/{link_id}", response_model=ScriptureLinkRead)
async def update_link(link_id: UUID, body: ScriptureLinkUpdate, db: AsyncSession = Depends(get_db)) -> ScriptureLink:
    row = await db.get(ScriptureLink, link_id)
    if not row:
        raise HTTPException(status_code=404, detail="Link not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/links/{link_id}", status_code=204)
async def delete_link(link_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ScriptureLink).where(ScriptureLink.id == link_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Link not found")


# --- Interactive sermon / passage flow maps (notes + graph JSON) ---


@router.get("/flow-folders", response_model=list[ScriptureFlowFolderRead])
async def list_flow_folders(db: AsyncSession = Depends(get_db)) -> list[ScriptureFlowFolder]:
    r = await db.execute(select(ScriptureFlowFolder).order_by(ScriptureFlowFolder.created_at.asc()))
    return list(r.scalars().all())


@router.post("/flow-folders", response_model=ScriptureFlowFolderRead, status_code=201)
async def create_flow_folder(body: ScriptureFlowFolderCreate, db: AsyncSession = Depends(get_db)) -> ScriptureFlowFolder:
    row = ScriptureFlowFolder(
        title=(body.title or "Untitled folder").strip() or "Untitled folder",
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.patch("/flow-folders/{folder_id}", response_model=ScriptureFlowFolderRead)
async def update_flow_folder(
    folder_id: UUID, body: ScriptureFlowFolderUpdate, db: AsyncSession = Depends(get_db)
) -> ScriptureFlowFolder:
    row = await db.get(ScriptureFlowFolder, folder_id)
    if not row:
        raise HTTPException(status_code=404, detail="Folder not found")
    data = body.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        row.title = (data["title"] or "Untitled folder").strip() or "Untitled folder"
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/flow-folders/{folder_id}", status_code=204)
async def delete_flow_folder(folder_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ScriptureFlowFolder).where(ScriptureFlowFolder.id == folder_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Folder not found")


@router.get("/flow-maps", response_model=list[ScriptureFlowMapRead])
async def list_flow_maps(db: AsyncSession = Depends(get_db)) -> list[ScriptureFlowMap]:
    r = await db.execute(select(ScriptureFlowMap).order_by(ScriptureFlowMap.updated_at.desc()))
    return list(r.scalars().all())


@router.get("/flow-maps/chapter-index", response_model=FlowMapChapterIndexResponse)
async def flow_maps_chapter_index(
    book: str = Query(..., description="Book name, e.g. John"),
    chapter: int = Query(..., ge=1),
    db: AsyncSession = Depends(get_db),
) -> FlowMapChapterIndexResponse:
    """Aggregate passage-map nodes and edges for reader UI (per verse in this chapter)."""
    want = _norm_reader_book(book)
    r = await db.execute(select(ScriptureFlowMap))
    rows = list(r.scalars().all())

    buckets: dict[int, dict] = {}

    def verse_bucket(v: int) -> dict:
        if v not in buckets:
            buckets[v] = {"in_maps": {}, "leads_to": {}, "led_from": {}}
        return buckets[v]

    for row in rows:
        g = row.graph_dict()
        nodes_raw = g.get("nodes") or []
        edges_raw = g.get("edges") or []
        if not isinstance(nodes_raw, list):
            nodes_raw = []
        if not isinstance(edges_raw, list):
            edges_raw = []

        parsed_nodes: dict[str, dict] = {}
        for n in nodes_raw:
            pn = _parse_flow_graph_node(n)
            if pn is None:
                continue
            parsed_nodes[pn["id"]] = pn

        title = (row.title or "Untitled map").strip() or "Untitled map"
        mid = str(row.id)

        for pn in parsed_nodes.values():
            if _norm_reader_book(pn["book"]) != want or int(pn["chapter"]) != chapter:
                continue
            mk = (mid, pn["label"])
            for v in range(int(pn["vs"]), int(pn["ve"]) + 1):
                verse_bucket(v)["in_maps"][mk] = {
                    "map_id": row.id,
                    "map_title": title,
                    "span_label": pn["label"],
                }

        for e in edges_raw:
            if not isinstance(e, dict):
                continue
            src_id = e.get("source")
            tgt_id = e.get("target")
            if not isinstance(src_id, str) or not isinstance(tgt_id, str):
                continue
            src = parsed_nodes.get(src_id)
            tgt = parsed_nodes.get(tgt_id)
            if not src or not tgt:
                continue
            ed = e.get("data")
            kind = "manual" if isinstance(ed, dict) and ed.get("kind") == "manual" else "chain"

            if _norm_reader_book(src["book"]) == want and int(src["chapter"]) == chapter:
                tk = (mid, tgt["label"], kind)
                for v in range(int(src["vs"]), int(src["ve"]) + 1):
                    verse_bucket(v)["leads_to"][tk] = {
                        "map_id": row.id,
                        "map_title": title,
                        "ref_label": tgt["label"],
                        "kind": kind,
                    }

            if _norm_reader_book(tgt["book"]) == want and int(tgt["chapter"]) == chapter:
                fk = (mid, src["label"], kind)
                for v in range(int(tgt["vs"]), int(tgt["ve"]) + 1):
                    verse_bucket(v)["led_from"][fk] = {
                        "map_id": row.id,
                        "map_title": title,
                        "ref_label": src["label"],
                        "kind": kind,
                    }

    verses_out: dict[str, FlowMapVerseRollup] = {}
    for v in sorted(buckets.keys()):
        payload = buckets[v]
        verses_out[str(v)] = FlowMapVerseRollup(
            in_maps=[FlowMapVerseMention(**x) for x in payload["in_maps"].values()],
            leads_to=[FlowMapEdgeHit(**x) for x in payload["leads_to"].values()],
            led_from=[FlowMapEdgeHit(**x) for x in payload["led_from"].values()],
        )
    return FlowMapChapterIndexResponse(verses=verses_out)


@router.post("/flow-maps", response_model=ScriptureFlowMapRead, status_code=201)
async def create_flow_map(body: ScriptureFlowMapCreate, db: AsyncSession = Depends(get_db)) -> ScriptureFlowMap:
    folder_id = body.folder_id
    if folder_id is not None:
        f = await db.get(ScriptureFlowFolder, folder_id)
        if not f:
            raise HTTPException(status_code=400, detail="Folder not found")
    row = ScriptureFlowMap(
        title=body.title.strip() or "Untitled map",
        folder_id=folder_id,
        notes_markdown="",
        graph_json={"nodes": [], "edges": []},
        updated_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.get("/flow-maps/{map_id}", response_model=ScriptureFlowMapRead)
async def get_flow_map(map_id: UUID, db: AsyncSession = Depends(get_db)) -> ScriptureFlowMap:
    row = await db.get(ScriptureFlowMap, map_id)
    if not row:
        raise HTTPException(status_code=404, detail="Flow map not found")
    return row


@router.patch("/flow-maps/{map_id}", response_model=ScriptureFlowMapRead)
async def update_flow_map(
    map_id: UUID, body: ScriptureFlowMapUpdate, db: AsyncSession = Depends(get_db)
) -> ScriptureFlowMap:
    row = await db.get(ScriptureFlowMap, map_id)
    if not row:
        raise HTTPException(status_code=404, detail="Flow map not found")
    data = body.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        row.title = (data["title"] or "Untitled map").strip() or "Untitled map"
    if "notes_markdown" in data and data["notes_markdown"] is not None:
        row.notes_markdown = data["notes_markdown"]
    if "graph_json" in data and data["graph_json"] is not None:
        row.graph_json = data["graph_json"]
    if "folder_id" in data:
        fid = data["folder_id"]
        if fid is not None:
            f = await db.get(ScriptureFlowFolder, fid)
            if not f:
                raise HTTPException(status_code=400, detail="Folder not found")
        row.folder_id = fid
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(row)
    return row


@router.delete("/flow-maps/{map_id}", status_code=204)
async def delete_flow_map(map_id: UUID, db: AsyncSession = Depends(get_db)) -> None:
    res = await db.execute(delete(ScriptureFlowMap).where(ScriptureFlowMap.id == map_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Flow map not found")
