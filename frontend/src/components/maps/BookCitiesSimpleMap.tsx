import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import type { HistoricOverlayRender } from "@/components/maps/BookCitiesMapLibreMap";
import {
  buildRouteArcData,
  lineStringFeatureFromStops,
  loadBiblicalRoutesCatalog,
  locationIndexById,
  routeHasDeckSegments,
  type BiblicalRouteDef,
  type BiblicalRoutesFile,
  type RouteLineFeature,
} from "@/lib/biblicalRoutesCatalog";
import { type BibleMapLocationJson, locationMentionsBook } from "@/lib/bookCitiesFromLocations";
import {
  fetchOverlayGeoJson,
  loadHistoricalOverlaysManifest,
  type HistoricalOverlayManifestEntry,
  type HistoricalOverlaysFile,
} from "@/lib/historicalOverlaysCatalog";
import {
  distinctRoutePersons,
  filterBiblicalRoutesByEntity,
  filterBiblicalRoutesForReader,
  type BiblicalRouteListScope,
} from "@/lib/biblicalRouteReaderMatch";
import { publicAssetUrl } from "@/lib/publicAssetUrl";

const BookCitiesMapLibreMap = lazy(async () => {
  const m = await import("@/components/maps/BookCitiesMapLibreMap");
  return { default: m.BookCitiesMapLibreMap };
});

const ERA_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All eras" },
  { value: "patriarchs", label: "Patriarchs" },
  { value: "exodus-conquest", label: "Exodus & conquest" },
  { value: "united-kingdom", label: "United kingdom" },
  { value: "divided-kingdom", label: "Divided kingdom" },
  { value: "exile-return", label: "Exile & return" },
  { value: "second-temple", label: "Second Temple" },
  { value: "jesus-ministry", label: "Jesus’ ministry" },
  { value: "early-church", label: "Early church" },
];

let locationsJsonCache: BibleMapLocationJson[] | null = null;

async function loadLocationsJson(): Promise<BibleMapLocationJson[]> {
  if (locationsJsonCache) return locationsJsonCache;
  const url = publicAssetUrl("bible-map/data/locations.json");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as BibleMapLocationJson[];
  locationsJsonCache = Array.isArray(data) ? data : [];
  return locationsJsonCache;
}

type BookCitiesSimpleMapProps = {
  book: string;
  chapter?: number;
  onClose?: () => void;
  atlasBrowseHref?: string;
  className?: string;
  panelTone?: "light" | "dark";
};

function routeById(routes: BiblicalRouteDef[], id: string): BiblicalRouteDef | undefined {
  return routes.find((r) => r.id === id);
}

function overlayEntryById(entries: HistoricalOverlayManifestEntry[], id: string): HistoricalOverlayManifestEntry | undefined {
  return entries.find((e) => e.id === id);
}

const ROUTE_SCOPE_OPTIONS: { value: BiblicalRouteListScope; label: string }[] = [
  { value: "all", label: "All books" },
  { value: "book", label: "This book" },
  { value: "chapter", label: "This chapter" },
];

export function BookCitiesSimpleMap({
  book,
  chapter = 1,
  onClose,
  atlasBrowseHref,
  className = "",
  panelTone = "light",
}: BookCitiesSimpleMapProps) {
  const [locations, setLocations] = useState<BibleMapLocationJson[] | null>(null);
  const [routesFile, setRoutesFile] = useState<BiblicalRoutesFile | null>(null);
  const [overlaysManifest, setOverlaysManifest] = useState<HistoricalOverlaysFile | null>(null);
  const [eraFilter, setEraFilter] = useState<string>("all");
  const [routeScope, setRouteScope] = useState<BiblicalRouteListScope>(() => (book.trim() ? "book" : "all"));
  /** Exact `person` field from catalog, or "__untagged__", or "" for any figure. */
  const [entityQuick, setEntityQuick] = useState<string>("");
  /** Substring filter on person / label / description (wins over figure dropdown when non-empty). */
  const [entityContains, setEntityContains] = useState("");
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [overlayId, setOverlayId] = useState<string>("");
  const [historicOverlay, setHistoricOverlay] = useState<HistoricOverlayRender>(null);
  const [overlayErr, setOverlayErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const prevBookRef = useRef(book);

  useEffect(() => {
    const had = prevBookRef.current.trim();
    const has = book.trim();
    prevBookRef.current = book;
    if (!had && has) setRouteScope("book");
  }, [book]);

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    void (async () => {
      try {
        const [locs, routes, ov] = await Promise.all([
          loadLocationsJson(),
          loadBiblicalRoutesCatalog().catch(
            (): BiblicalRoutesFile => ({ routes: [], dataNotes: undefined }),
          ),
          loadHistoricalOverlaysManifest().catch(() => ({ overlays: [] as HistoricalOverlayManifestEntry[] })),
        ]);
        if (cancelled) return;
        setLocations(locs);
        setRoutesFile(routes);
        setOverlaysManifest(ov);
      } catch {
        if (!cancelled) setErr("Could not load map data.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadOverlay = useCallback(async (entry: HistoricalOverlayManifestEntry) => {
    setOverlayErr(null);
    try {
      const geojson = await fetchOverlayGeoJson(entry);
      const bundle: HistoricOverlayRender = {
        geojson,
        fillColor: entry.fillColor ?? "#c9a882",
        fillOpacity: entry.fillOpacity ?? 0.28,
        lineColor: entry.lineColor ?? "#7a4a1f",
        attributionNote: entry.attributionNote,
      };
      setHistoricOverlay(bundle);
    } catch {
      setHistoricOverlay(null);
      setOverlayErr("Could not load region GeoJSON.");
    }
  }, []);

  useEffect(() => {
    if (!overlayId.trim() || !overlaysManifest?.overlays.length) {
      setHistoricOverlay(null);
      setOverlayErr(null);
      return;
    }
    const entry = overlayEntryById(overlaysManifest.overlays, overlayId);
    if (!entry) {
      setHistoricOverlay(null);
      return;
    }
    void loadOverlay(entry);
  }, [overlayId, overlaysManifest, loadOverlay]);

  const placesForBook = useMemo(() => {
    if (!book.trim() || !locations) return [];
    return locations.filter((loc) => {
      if (!locationMentionsBook(loc, book)) return false;
      if (eraFilter === "all") return true;
      const eras = loc.era ?? [];
      if (!eras.length) return true;
      return eras.includes(eraFilter);
    });
  }, [book, locations, eraFilter]);

  const routesForBookUi = useMemo(() => {
    if (!routesFile?.routes.length) return [];
    const ch = Math.max(1, chapter);
    return filterBiblicalRoutesForReader(routesFile.routes, book, ch, routeScope, locations);
  }, [routesFile, book, chapter, routeScope, locations]);

  useEffect(() => {
    if (!book.trim() && routeScope !== "all") setRouteScope("all");
  }, [book, routeScope]);

  const routesForJourneyList = useMemo(
    () => filterBiblicalRoutesByEntity(routesForBookUi, entityContains, entityQuick),
    [routesForBookUi, entityContains, entityQuick],
  );

  const personOptions = useMemo(() => distinctRoutePersons(routesForBookUi), [routesForBookUi]);

  useEffect(() => {
    const allowed = new Set(routesForJourneyList.map((r) => r.id));
    setSelectedRouteIds((ids) => ids.filter((id) => allowed.has(id)));
  }, [routesForJourneyList]);

  const selectedRoutes = useMemo(() => {
    if (!routesFile || !selectedRouteIds.length) return [];
    return selectedRouteIds
      .map((id) => routeById(routesFile.routes, id))
      .filter((r): r is BiblicalRouteDef => Boolean(r));
  }, [routesFile, selectedRouteIds]);

  const byIdAll = useMemo(() => (locations ? locationIndexById(locations) : null), [locations]);

  const segmentedSelected = useMemo(() => selectedRoutes.filter((r) => routeHasDeckSegments(r)), [selectedRoutes]);

  const paulArcs = useMemo(() => {
    if (!segmentedSelected.length || !byIdAll) return [];
    return buildRouteArcData(segmentedSelected, byIdAll, segmentedSelected.map((r) => r.id));
  }, [segmentedSelected, byIdAll]);

  const routeLines = useMemo((): RouteLineFeature[] | null => {
    if (!byIdAll) return null;
    const lineOnly = selectedRoutes.filter((r) => !routeHasDeckSegments(r));
    const feats = lineOnly
      .map((r) => lineStringFeatureFromStops(r.stopPlaceIds ?? [], byIdAll))
      .filter((f): f is RouteLineFeature => Boolean(f));
    return feats.length ? feats : null;
  }, [selectedRoutes, byIdAll]);

  const routePlaceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of selectedRoutes) {
      for (const id of r.stopPlaceIds ?? []) ids.add(id);
      for (const s of r.segments ?? []) {
        ids.add(s.from);
        ids.add(s.to);
      }
    }
    return ids;
  }, [selectedRoutes]);

  /** Book + era markers, plus any route stop not already included (so paths stay readable). */
  const placesOnMap = useMemo(() => {
    if (!locations || !byIdAll) return [];
    const base = placesForBook;
    if (!selectedRoutes.length) return base;
    const extra = locations.filter((loc) => routePlaceIds.has(loc.id) && !base.some((b) => b.id === loc.id));
    return [...base, ...extra];
  }, [locations, byIdAll, placesForBook, selectedRoutes, routePlaceIds]);

  const shell =
    panelTone === "dark"
      ? "bg-[#0d1424] text-neutral-100"
      : "bg-neutral-50 text-neutral-900";
  const bar =
    panelTone === "dark"
      ? "border-white/10 bg-[#141c2e]"
      : "border-neutral-200 bg-white";
  const titleMuted = panelTone === "dark" ? "text-neutral-400" : "text-neutral-500";
  const titleStrong = panelTone === "dark" ? "text-neutral-100" : "text-neutral-800";
  const linkClass =
    panelTone === "dark"
      ? "text-amber-300/90 underline hover:text-amber-200"
      : "text-amber-800 underline hover:text-amber-950";
  const closeBtn =
    panelTone === "dark"
      ? "text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800";
  const errMuted = panelTone === "dark" ? "text-red-300" : "text-red-600";
  const loadMuted = panelTone === "dark" ? "text-neutral-400" : "text-neutral-600";
  const footSub = panelTone === "dark" ? "text-neutral-500" : "text-neutral-500";
  const selectClass =
    panelTone === "dark"
      ? "rounded border border-white/15 bg-[#0f1420] px-1.5 py-1 text-[10px] text-neutral-100"
      : "rounded border border-neutral-200 bg-white px-1.5 py-1 text-[10px] text-neutral-800";
  const inputClass =
    panelTone === "dark"
      ? "rounded border border-white/15 bg-[#0f1420] px-1.5 py-1 text-[10px] text-neutral-100 placeholder:text-neutral-500"
      : "rounded border border-neutral-200 bg-white px-1.5 py-1 text-[10px] text-neutral-800 placeholder:text-neutral-400";
  const tinyBtnClass =
    panelTone === "dark"
      ? "rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-medium text-neutral-200 hover:bg-white/10"
      : "rounded border border-neutral-200 px-1.5 py-0.5 text-[9px] font-medium text-neutral-700 hover:bg-neutral-100";

  const overlayOptions = overlaysManifest?.overlays ?? [];

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col ${shell} ${className}`}>
      <div className={`flex shrink-0 flex-wrap items-center gap-2 border-b px-2 py-2 ${bar}`}>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${titleStrong}`}>Book cities</p>
          <p className={`truncate text-[11px] ${titleMuted}`}>
            MapLibre · places from <span className="font-mono">locations.json</span> for{" "}
            <span className="font-medium">{book || "…"}</span>
            {book.trim() ? (
              <>
                {" "}
                <span className="text-neutral-500">·</span> ch. {Math.max(1, chapter)}
              </>
            ) : null}{" "}
            · era, routes, regions
          </p>
        </div>
        {atlasBrowseHref ? (
          <Link to={atlasBrowseHref} className={`shrink-0 text-[11px] font-medium ${linkClass}`}>
            Open maps page
          </Link>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-lg p-2 ${closeBtn}`}
            aria-label="Close map panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {locations && routesFile && overlaysManifest ? (
        <div className={`flex shrink-0 flex-wrap items-end gap-2 border-b px-2 py-1.5 ${bar}`}>
          <label className={`flex flex-col gap-0.5 text-[9px] font-semibold uppercase tracking-wide ${titleMuted}`}>
            Era
            <select className={selectClass} value={eraFilter} onChange={(e) => setEraFilter(e.target.value)}>
              {ERA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex min-w-[6.5rem] flex-col gap-0.5 text-[9px] font-semibold uppercase tracking-wide ${titleMuted}`}>
            Routes
            <select
              className={selectClass}
              value={routeScope}
              onChange={(e) => setRouteScope(e.target.value as BiblicalRouteListScope)}
              disabled={!book.trim()}
              title={!book.trim() ? "Choose a book in the reader or maps URL to filter routes." : undefined}
            >
              {ROUTE_SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex min-w-[6.5rem] flex-col gap-0.5 text-[9px] font-semibold uppercase tracking-wide ${titleMuted}`}>
            Figure
            <select
              className={`${selectClass} min-w-[6rem]`}
              value={entityQuick}
              onChange={(e) => setEntityQuick(e.target.value)}
              disabled={Boolean(entityContains.trim())}
              title={
                entityContains.trim()
                  ? "Clear the text filter to use the figure list."
                  : "Filter journeys by catalog person field."
              }
            >
              <option value="">All figures</option>
              <option value="__untagged__">Untagged</option>
              {personOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className={`flex min-w-[7rem] flex-1 flex-col gap-0.5 text-[9px] font-semibold uppercase tracking-wide ${titleMuted}`}>
            Match text
            <input
              type="search"
              className={`${inputClass} min-w-0`}
              value={entityContains}
              onChange={(e) => setEntityContains(e.target.value)}
              placeholder="e.g. ark, Moses…"
              aria-label="Filter routes by text in person, label, or description"
            />
          </label>
          <div className={`flex min-w-[9rem] max-w-[14rem] flex-col gap-0.5 ${titleMuted}`}>
            <span className="text-[9px] font-semibold uppercase tracking-wide">Journeys</span>
            <div className="flex items-stretch gap-1">
              <select
                multiple
                className={`${selectClass} min-h-[3.25rem] min-w-0 flex-1 py-0.5`}
                size={Math.min(5, Math.max(2, routesForJourneyList.length || 2))}
                value={selectedRouteIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                  setSelectedRouteIds(opts);
                }}
                aria-label="Select one or more journeys to show on the map"
              >
                {routesForJourneyList.length ? (
                  routesForJourneyList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))
                ) : (
                  <option value="__no_routes__" disabled>
                    No routes match
                  </option>
                )}
              </select>
              <div className="flex shrink-0 flex-col justify-center gap-0.5">
                <button type="button" className={tinyBtnClass} onClick={() => setSelectedRouteIds([])}>
                  Clear
                </button>
                <button
                  type="button"
                  className={tinyBtnClass}
                  onClick={() => setSelectedRouteIds(routesForJourneyList.map((r) => r.id))}
                  disabled={!routesForJourneyList.length}
                >
                  All listed
                </button>
              </div>
            </div>
          </div>
          <label className={`flex min-w-[9rem] flex-col gap-0.5 text-[9px] font-semibold uppercase tracking-wide ${titleMuted}`}>
            Region
            <select className={`${selectClass} min-w-[8.5rem]`} value={overlayId} onChange={(e) => setOverlayId(e.target.value)}>
              <option value="">None</option>
              {overlayOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {overlayErr ? <p className={`px-2 py-1 text-center text-[11px] ${errMuted}`}>{overlayErr}</p> : null}

      {err ? (
        <p className={`p-4 text-center text-sm ${errMuted}`}>{err}</p>
      ) : locations === null ? (
        <p className={`p-4 text-center text-sm ${loadMuted}`}>Loading places…</p>
      ) : (
        <>
          <Suspense
            fallback={
              <div className={`flex min-h-[14rem] flex-1 items-center justify-center text-sm ${loadMuted}`}>Loading map…</div>
            }
          >
            <BookCitiesMapLibreMap
              places={placesOnMap}
              panelTone={panelTone}
              routeLines={routeLines}
              historicOverlay={historicOverlay}
              paulArcs={paulArcs.length ? paulArcs : null}
            />
          </Suspense>
          <div className={`shrink-0 border-t px-2 py-1.5 ${bar}`}>
            <p className={`text-center text-[10px] ${footSub}`}>
              {placesForBook.length} in-book marker{placesForBook.length === 1 ? "" : "s"}
              {selectedRoutes.length
                ? ` · ${selectedRoutes.length} journey${selectedRoutes.length === 1 ? "" : "s"}: ${selectedRoutes.map((r) => r.label).join(" · ")}`
                : ""}
              {historicOverlay ? " · region overlay on" : ""}
              {routesFile && book.trim()
                ? ` · ${routesForBookUi.length} route${routesForBookUi.length === 1 ? "" : "s"} (${routeScope === "all" ? "all books" : routeScope === "book" ? "this book" : "this chapter"})`
                : ""}
              {entityContains.trim() || entityQuick
                ? ` · ${routesForJourneyList.length} listed after figure/text filter`
                : ""}
              . Hold Ctrl (Windows) or ⌘ (Mac) in the journey list to select several. Add Babylon/Persia/twelve-tribes polygons to{" "}
              <span className="font-mono">historical-overlays.json</span> + <span className="font-mono">data/overlays/*.geojson</span>.
              Edit <span className="font-mono">biblical-routes.json</span> for more journeys (<span className="font-mono">stopPlaceIds</span> and/or <span className="font-mono">segments</span>).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
