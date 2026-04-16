import { ChevronLeft, ChevronRight, GripVertical, Library, Search, Trash2, X } from "lucide-react";
import { KAIROS_PERSON_DRAG_MIME, KAIROS_PLACE_DRAG_MIME, PanZoomImage } from "@/components/maps/PanZoomImage";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMergedChapterState,
  removeChapterMarker,
  setChapterCatalogAndCustom,
  toggleChapterMarkerPinned,
  upsertChapterMarker,
} from "@/lib/chapterAtlasState";
import { atlasMarkersForCatalogMap, clampAtlasCoord, markersFromChapterState } from "@/lib/mapAtlasOverlays";
import { mapForPassage, mapsForPassageRotation, type PassageMapResult } from "@/lib/mapForPassage";
import { loadPlaces, placeScriptureMentionsChapter } from "@/lib/places";
import { loadPeopleProfiles, profileAppearsInBook } from "@/lib/timelinePeople";
import { pickReaderWorkspaceMap } from "@/lib/workspaceMapReaderMatch";
import { useTimelineStore } from "@/store/timelineStore";
import {
  groupWorkspaceMapsBySection,
  orderedSectionKeys,
  type WorkspaceMapCatalogEntry,
} from "@/lib/workspaceMapSections";
import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import { publicAssetUrl } from "@/lib/publicAssetUrl";
import clsx from "clsx";

export type WorkspaceMapCatalog = {
  generated?: string;
  source?: string;
  entries: WorkspaceMapCatalogEntry[];
};

type WorkspaceMapsGalleryProps = {
  variant: "page" | "reader";
  readerContext?: string;
  onCloseReader?: () => void;
  /** With variant `reader`, show only the plate chosen for this passage. */
  matchBook?: string;
  matchChapter?: number;
  /** Refined map selection (e.g. Luke 9 before vs after 9:51). */
  matchVerse?: number;
};

export function WorkspaceMapsGallery({
  variant,
  readerContext,
  onCloseReader,
  matchBook,
  matchChapter = 1,
  matchVerse,
}: WorkspaceMapsGalleryProps) {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const [catalog, setCatalog] = useState<WorkspaceMapCatalog | null>(null);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [preview, setPreview] = useState<WorkspaceMapCatalogEntry | null>(null);
  const events = useTimelineStore((s) => s.events);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = publicAssetUrl("bible-map/data/workspace-maps-catalog.json");
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as WorkspaceMapCatalog;
        if (!cancelled) {
          setCatalog(Array.isArray(data.entries) ? data : { entries: [] });
          setCatalogErr(null);
        }
      } catch {
        if (!cancelled) {
          setCatalog(null);
          setCatalogErr("Could not load workspace map catalog.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isReader = variant === "reader";
  const readerMatchMode = Boolean(isReader && matchBook && catalog?.entries?.length);

  const readerRotation = useMemo(() => {
    if (!readerMatchMode || !matchBook || !catalog?.entries.length) return [];
    const metas = mapsForPassageRotation(matchBook, matchChapter, matchVerse);
    const pairs = metas
      .map((meta) => {
        const e = catalog.entries.find((x) => x.id === meta.catalogId);
        return e ? { entry: e, meta } : null;
      })
      .filter((p): p is { entry: WorkspaceMapCatalogEntry; meta: PassageMapResult } => Boolean(p));
    if (pairs.length) return pairs;
    const fb = pickReaderWorkspaceMap(matchBook, matchChapter, catalog.entries, matchVerse);
    if (!fb) return [];
    const meta = mapForPassage(matchBook, matchChapter, matchVerse);
    return [{ entry: fb, meta }];
  }, [readerMatchMode, matchBook, matchChapter, matchVerse, catalog?.entries]);

  const defaultCatalogId = readerRotation[0]?.entry.id ?? null;

  const chapterState = useMemo(
    () => (matchBook ? getMergedChapterState(matchBook, matchChapter, defaultCatalogId) : null),
    [matchBook, matchChapter, defaultCatalogId, workspaceEpoch],
  );

  const effectiveRotation = useMemo(() => {
    if (!readerMatchMode || !matchBook || !catalog?.entries.length || !chapterState) return [];
    if (chapterState.customMapDataUrl) {
      const meta = mapForPassage(matchBook, matchChapter, matchVerse);
      return [{ entry: { id: "kairos-custom-map", file: "__custom__", title: "Custom map" }, meta }];
    }
    if (chapterState.catalogMapId) {
      const e = catalog.entries.find((x) => x.id === chapterState.catalogMapId);
      if (e) {
        const meta = mapForPassage(matchBook, matchChapter, matchVerse);
        return [{ entry: e, meta }];
      }
    }
    return readerRotation;
  }, [readerMatchMode, matchBook, matchChapter, matchVerse, catalog?.entries, chapterState, readerRotation]);

  const rotationKey = effectiveRotation.map((p) => p.entry.id).join("|");
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [peopleDropdownId, setPeopleDropdownId] = useState("");
  const [peopleSearchQ, setPeopleSearchQ] = useState("");
  const [placesSearchQ, setPlacesSearchQ] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"people" | "places">("people");

  useEffect(() => {
    setCarouselIdx(0);
  }, [rotationKey]);

  const readerEntry = effectiveRotation[carouselIdx]?.entry;
  const readerMeta = effectiveRotation[carouselIdx]?.meta;

  useEffect(() => {
    const first = effectiveRotation[0];
    if (!first) return;
    setToast(`Map updated · ${first.meta.title}`);
    const t = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(t);
  }, [rotationKey]);

  const readerAtlasMarkers = useMemo(() => {
    if (!matchBook || !chapterState) return [];
    return markersFromChapterState(chapterState, {
      events,
      profiles: loadPeopleProfiles(),
      places: loadPlaces(),
    });
  }, [matchBook, chapterState, events, workspaceEpoch]);

  const readerMapSrc = useMemo(() => {
    if (!readerEntry) return "";
    if (chapterState?.customMapDataUrl) return chapterState.customMapDataUrl;
    return publicAssetUrl(`bible-map/workspace-maps/${readerEntry.file}`);
  }, [readerEntry, chapterState?.customMapDataUrl]);

  const peopleInBook = useMemo(() => {
    if (!matchBook) return [];
    const profiles = loadPeopleProfiles();
    const rows: { id: string; name: string }[] = [];
    for (const ev of events) {
      if (ev.type !== "person" && ev.type !== "ruler") continue;
      const prof = profiles[ev.id];
      if (!prof || prof.hidden) continue;
      if (!profileAppearsInBook(prof, matchBook)) continue;
      rows.push({ id: ev.id, name: prof.name || ev.title });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [events, matchBook, workspaceEpoch]);

  const commitAtlasMarker = useCallback(
    (kind: "person" | "place", entityId: string, nx: number, ny: number) => {
      if (!matchBook) return;
      upsertChapterMarker(matchBook, matchChapter, defaultCatalogId, kind, entityId, {
        nx: clampAtlasCoord(nx),
        ny: clampAtlasCoord(ny),
        pinned: false,
      });
    },
    [matchBook, matchChapter, defaultCatalogId],
  );

  const placesInChapter = useMemo(() => {
    if (!matchBook) return [];
    const ch = Math.max(1, matchChapter);
    return Object.values(loadPlaces())
      .filter((p) => placeScriptureMentionsChapter(p, matchBook, ch))
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [matchBook, matchChapter, workspaceEpoch]);

  const peopleListRows = useMemo(() => {
    const q = peopleSearchQ.trim().toLowerCase();
    let rows = peopleInBook;
    if (peopleDropdownId) rows = rows.filter((p) => p.id === peopleDropdownId);
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    return rows;
  }, [peopleInBook, peopleDropdownId, peopleSearchQ]);

  const placesListRows = useMemo(() => {
    const q = placesSearchQ.trim().toLowerCase();
    let rows = placesInChapter;
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    return rows;
  }, [placesInChapter, placesSearchQ]);

  useEffect(() => {
    setPeopleDropdownId("");
    setPeopleSearchQ("");
    setPlacesSearchQ("");
  }, [matchBook, matchChapter]);

  const previewAtlasMarkers = useMemo(() => {
    if (!preview) return [];
    return atlasMarkersForCatalogMap(preview.id, {
      events,
      profiles: loadPeopleProfiles(),
      places: loadPlaces(),
    });
  }, [preview?.id, events, workspaceEpoch]);

  const filtered = useMemo(() => {
    const entries = catalog?.entries ?? [];
    const qq = deferredQ.trim().toLowerCase();
    if (!qq) return entries;
    return entries.filter((e) => `${e.title} ${e.file}`.toLowerCase().includes(qq));
  }, [catalog, deferredQ]);

  const sections = useMemo(() => {
    const grouped = groupWorkspaceMapsBySection(filtered);
    return orderedSectionKeys(grouped).map((title) => ({
      title,
      entries: grouped.get(title) ?? [],
    }));
  }, [filtered]);

  useEffect(() => {
    if (!preview) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [preview]);

  const gridClass =
    "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 [&_img]:[content-visibility:auto]";
  const tileTitleClass = "mt-1.5 line-clamp-2 text-[11px] leading-snug text-neutral-400";

  if (catalogErr) {
    return <p className={clsx("text-sm text-red-400", isReader && "px-2")}>{catalogErr}</p>;
  }

  if (!catalog?.entries?.length) {
    return (
      <div
        className={clsx(
          "rounded-xl border border-dashed p-4",
          isReader ? "border-neutral-200 bg-neutral-50 text-neutral-600" : "border-white/20 bg-[#1a2744]/80 text-neutral-400",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <Library className="h-4 w-4 text-amber-500/90" aria-hidden />
          Workspace maps
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          No plates in the catalog yet. In the <code className="rounded bg-black/10 px-1 text-xs">frontend</code> folder run{" "}
          <code className="rounded bg-black/10 px-1 text-xs">npm run sync:workspace-maps</code> to copy images from your{" "}
          <code className="rounded bg-black/10 px-1 text-xs">Desktop/Maps</code> folder, then refresh.
        </p>
      </div>
    );
  }

  if (readerMatchMode) {
    const atlasBrowse = `/scripture/maps?book=${encodeURIComponent(matchBook!)}&chapter=${String(matchChapter)}`;
    const canStep = effectiveRotation.length > 1;
    const stepPrev = () => setCarouselIdx((i) => (i - 1 + effectiveRotation.length) % effectiveRotation.length);
    const stepNext = () => setCarouselIdx((i) => (i + 1) % effectiveRotation.length);

    const onPlateChange = (catalogId: string) => {
      setChapterCatalogAndCustom(matchBook!, matchChapter, defaultCatalogId, {
        catalogMapId: catalogId || null,
        customMapDataUrl: null,
      });
    };

    const onCustomMapFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !matchBook) return;
      const fr = new FileReader();
      fr.onload = () => {
        const u = typeof fr.result === "string" ? fr.result : null;
        if (!u) return;
        if (u.length > 4_500_000) {
          window.alert("Image is too large to store. Try a smaller file (under ~3MB).");
          return;
        }
        setChapterCatalogAndCustom(matchBook, matchChapter, defaultCatalogId, { customMapDataUrl: u });
      };
      fr.readAsDataURL(file);
      e.target.value = "";
    };

    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col bg-neutral-50">
        {toast ? (
          <div
            className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full border border-neutral-200 bg-neutral-900 px-3 py-1 text-[10px] font-medium text-white shadow-md transition-opacity duration-300"
            role="status"
          >
            {toast}
          </div>
        ) : null}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-800">Map for this passage</p>
            {readerContext ? <p className="truncate text-[11px] text-neutral-500">{readerContext}</p> : null}
          </div>
          {canStep ? (
            <span className="shrink-0 tabular-nums text-[10px] text-neutral-500">
              Map {carouselIdx + 1} of {effectiveRotation.length}
            </span>
          ) : null}
          <Link
            to={atlasBrowse}
            className="shrink-0 text-[11px] font-medium text-amber-800 underline hover:text-amber-950"
          >
            All plates
          </Link>
          {onCloseReader ? (
            <button
              type="button"
              onClick={onCloseReader}
              className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              aria-label="Close map panel"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {readerEntry && readerMeta && chapterState ? (
          <>
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
              <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
                <div
                  key={`${readerEntry.id}-${chapterState.customMapDataUrl ? "custom" : "std"}`}
                  className="h-full min-h-0 opacity-100 transition-opacity duration-300 ease-out"
                >
                  <PanZoomImage
                    src={readerMapSrc}
                    alt={readerEntry.title}
                    className="h-full min-h-0"
                    atlasMarkers={readerAtlasMarkers}
                    doubleTapZoom={readerMeta.set === "B"}
                    editableMarkerPins
                    onAtlasMarkerCommit={commitAtlasMarker}
                  />
                </div>
              </div>
              <aside className="flex max-h-[min(52vh,420px)] min-h-0 w-full shrink-0 flex-col overflow-hidden border-neutral-200 bg-neutral-50/95 md:max-h-none md:w-[min(15rem,42vw)] md:max-w-[17rem] md:border-l md:border-t-0 border-t">
                <div className="shrink-0 space-y-1.5 border-b border-neutral-200 px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Atlas for this chapter</p>
                  <p className="text-[9px] leading-snug text-neutral-500">
                    Saved per book and chapter. Upload replaces the plate image until you clear it.
                  </p>
                  <label className="text-[10px] font-medium text-neutral-600">Workspace plate</label>
                  <select
                    value={chapterState.catalogMapId ?? defaultCatalogId ?? ""}
                    onChange={(e) => onPlateChange(e.target.value)}
                    className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[11px] text-neutral-800"
                  >
                    {(catalog?.entries ?? []).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <label className="cursor-pointer rounded border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-700 hover:bg-neutral-50">
                      Upload map
                      <input type="file" accept="image/*" className="sr-only" onChange={onCustomMapFile} />
                    </label>
                    {chapterState.customMapDataUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-[10px]"
                        onClick={() =>
                          setChapterCatalogAndCustom(matchBook!, matchChapter, defaultCatalogId, { customMapDataUrl: null })
                        }
                      >
                        Clear upload
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5 border-b border-neutral-200 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setSidebarTab("people")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold ${
                      sidebarTab === "people" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    People
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab("places")}
                    className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold ${
                      sidebarTab === "places" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Cities
                  </button>
                </div>

                {sidebarTab === "people" ? (
                  <>
                    <div className="shrink-0 space-y-1.5 border-b border-neutral-200 px-2 py-2">
                      <label className="sr-only" htmlFor="reader-map-people-dropdown">
                        Choose a person
                      </label>
                      <select
                        id="reader-map-people-dropdown"
                        value={peopleDropdownId}
                        onChange={(e) => setPeopleDropdownId(e.target.value)}
                        className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-[11px] text-neutral-800"
                      >
                        <option value="">All in this book ({peopleInBook.length})</option>
                        {peopleInBook.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={peopleSearchQ}
                        onChange={(e) => setPeopleSearchQ(e.target.value)}
                        placeholder="Filter names…"
                        className="h-8 text-xs"
                        aria-label="Filter people by name"
                      />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
                      {peopleListRows.length === 0 ? (
                        <p className="px-1.5 py-2 text-[11px] leading-relaxed text-neutral-500">
                          {peopleInBook.length === 0
                            ? "No one is tied to this book yet. Add scripture passages on each person’s profile."
                            : "No names match this filter."}
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {peopleListRows.map((p) => {
                            const onMap = Boolean(chapterState.people[p.id]);
                            const pin = chapterState.people[p.id];
                            return (
                              <li key={p.id} className="rounded-md border border-neutral-100 bg-white p-1 shadow-sm">
                                <div className="flex items-start gap-1">
                                  <div
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(KAIROS_PERSON_DRAG_MIME, p.id);
                                      e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="flex min-w-0 flex-1 cursor-grab items-center gap-1 rounded px-0.5 py-0.5 text-left text-[11px] text-neutral-800 active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                  </div>
                                  {onMap ? (
                                    <div className="flex shrink-0 flex-col gap-0.5">
                                      <button
                                        type="button"
                                        className="rounded px-1 text-[9px] font-medium text-amber-800 hover:bg-amber-50"
                                        onClick={() =>
                                          toggleChapterMarkerPinned(matchBook!, matchChapter, defaultCatalogId, "person", p.id)
                                        }
                                      >
                                        {pin?.pinned ? "Unpin" : "Pin"}
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded p-0.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                                        aria-label={`Remove ${p.name} from map`}
                                        onClick={() =>
                                          removeChapterMarker(matchBook!, matchChapter, defaultCatalogId, "person", p.id)
                                        }
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="shrink-0 border-b border-neutral-200 px-2 py-2">
                      <Input
                        value={placesSearchQ}
                        onChange={(e) => setPlacesSearchQ(e.target.value)}
                        placeholder="Filter cities…"
                        className="h-8 text-xs"
                        aria-label="Filter cities"
                      />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
                      {placesListRows.length === 0 ? (
                        <p className="px-1.5 py-2 text-[11px] leading-relaxed text-neutral-500">
                          {placesInChapter.length === 0
                            ? "No places list this chapter under Scripture scenes on the Places page."
                            : "No names match this filter."}
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {placesListRows.map((p) => {
                            const onMap = Boolean(chapterState.places[p.id]);
                            const pin = chapterState.places[p.id];
                            return (
                              <li key={p.id} className="rounded-md border border-neutral-100 bg-white p-1 shadow-sm">
                                <div className="flex items-start gap-1">
                                  <div
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData(KAIROS_PLACE_DRAG_MIME, p.id);
                                      e.dataTransfer.effectAllowed = "copy";
                                    }}
                                    className="flex min-w-0 flex-1 cursor-grab items-center gap-1 rounded px-0.5 py-0.5 text-left text-[11px] text-neutral-800 active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                  </div>
                                  {onMap ? (
                                    <div className="flex shrink-0 flex-col gap-0.5">
                                      <button
                                        type="button"
                                        className="rounded px-1 text-[9px] font-medium text-amber-800 hover:bg-amber-50"
                                        onClick={() =>
                                          toggleChapterMarkerPinned(matchBook!, matchChapter, defaultCatalogId, "place", p.id)
                                        }
                                      >
                                        {pin?.pinned ? "Unpin" : "Pin"}
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded p-0.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                                        aria-label={`Remove ${p.name} from map`}
                                        onClick={() =>
                                          removeChapterMarker(matchBook!, matchChapter, defaultCatalogId, "place", p.id)
                                        }
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                )}
                <p className="shrink-0 border-t border-neutral-200 px-2 py-1.5 text-[9px] leading-snug text-neutral-500">
                  Drag onto the map to place. Drag pins to move (unless pinned). Click a pin to open. Stored per chapter and synced when signed in.
                </p>
              </aside>
            </div>
            {canStep ? (
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-neutral-200 bg-white px-2 py-2">
                <button
                  type="button"
                  className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  aria-label="Previous map for this passage"
                  onClick={stepPrev}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <p className="min-w-0 flex-1 text-center text-[11px] font-medium text-neutral-600">
                  {carouselIdx + 1} / {effectiveRotation.length}
                  <span className="mx-1 text-neutral-300">·</span>
                  <span className="text-neutral-500">More than one plate matches</span>
                </p>
                <button
                  type="button"
                  className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  aria-label="Next map for this passage"
                  onClick={stepNext}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            ) : null}
            <div className="shrink-0 border-t border-neutral-200 bg-white px-2 py-1.5">
              <p className="truncate text-center text-[11px] font-medium text-neutral-700">
                {readerMeta.title} — {readerMeta.reference}
              </p>
              <p className="mt-0.5 text-center text-[10px] text-neutral-500">
                {readerMeta.set === "B"
                  ? "Life of Jesus plate: pinch, double-tap / double-click to zoom · drag empty area to pan"
                  : "Wheel or pinch zoom · drag empty area to pan"}
              </p>
            </div>
          </>
        ) : (
          <p className="p-4 text-center text-sm text-neutral-600">No matching plate found in the catalog.</p>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("flex h-full min-h-0 flex-1 flex-col bg-[#141c2e]")}>
      <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-50">Atlas plates</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Your synced workspace maps, grouped by period.</p>
          </div>
          <p className="text-xs text-neutral-600">{catalog.entries.length} images</p>
        </div>
        <div className="relative mt-3 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title…"
            className="h-10 border-white/10 bg-[#1a2744] pl-10 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        {sections.map(({ title, entries }) =>
          entries.length ? (
            <section key={title} className="[contain:content]">
              <h2 className="sticky top-0 z-[1] mb-3 border-b border-white/10 bg-[#141c2e]/95 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200/90 backdrop-blur-sm">
                {title}
              </h2>
              <div className={gridClass}>
                {entries.map((entry) => {
                  const thumb = publicAssetUrl(`bible-map/workspace-maps/${entry.file}`);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setPreview(entry)}
                      className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#1a2744] text-left focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <p className={clsx(tileTitleClass, "px-1.5 pb-1.5 text-neutral-300")} title={entry.title}>
                        {entry.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null,
        )}
        {!filtered.length ? <p className="text-center text-sm text-neutral-500">No matches.</p> : null}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex h-[min(88vh,920px)] max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-[#0f1420] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
              <p className="min-w-0 truncate text-sm font-medium text-neutral-100">{preview.title}</p>
              <Button type="button" size="sm" variant="secondary" className="shrink-0 bg-white/10 text-white hover:bg-white/20" onClick={() => setPreview(null)}>
                Close
              </Button>
            </div>
            <PanZoomImage
              key={preview.id}
              src={publicAssetUrl(`bible-map/workspace-maps/${preview.file}`)}
              alt={preview.title}
              className="min-h-0 flex-1 bg-[#0f1420]"
              controlsClassName="border-white/10 bg-[#141c2e] [&_button]:text-neutral-200 hover:[&_button]:bg-white/10 [&_span]:text-neutral-400"
              atlasMarkers={previewAtlasMarkers}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
