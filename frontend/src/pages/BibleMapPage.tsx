import { ArrowLeft, Clock, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { BookCitiesSimpleMap } from "@/components/maps/BookCitiesSimpleMap";
import { WorkspaceMapsGallery } from "@/components/maps/WorkspaceMapsGallery";
import { Button } from "@/components/ui/button";
import { CHAPTER_COUNT } from "@/lib/bibleCanon";
import { getBookHistoricalContext } from "@/lib/bookHistoricalContext";
import { addAtlasRoute, loadAtlasRoutes, removeAtlasRoute, routesForCatalogMapId, type AtlasRoute } from "@/lib/mapAtlasOverlays";
import { loadPlaces } from "@/lib/places";
import type { WorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import { fetchWorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import { pickReaderWorkspaceMap } from "@/lib/workspaceMapReaderMatch";

const CANON_BOOKS = Object.keys(CHAPTER_COUNT) as (keyof typeof CHAPTER_COUNT)[];

type AtlasMainView = "workspace" | "book-cities";

export function BibleMapPage() {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mainView, setMainView] = useState<AtlasMainView>("workspace");
  const [catalog, setCatalog] = useState<WorkspaceMapCatalog | null>(null);
  const [routesVersion, setRoutesVersion] = useState(0);
  const [placesRefresh, setPlacesRefresh] = useState(0);
  const [routeFromId, setRouteFromId] = useState("");
  const [routeToId, setRouteToId] = useState("");
  const [routeLabel, setRouteLabel] = useState("");

  const book = searchParams.get("book")?.trim() || "";
  const chapter = Math.max(1, parseInt(searchParams.get("chapter") || "1", 10) || 1);

  const ctx = book ? getBookHistoricalContext(book) : null;

  useEffect(() => {
    let cancelled = false;
    void fetchWorkspaceMapCatalog().then((data) => {
      if (!cancelled) setCatalog(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlate = useMemo(() => {
    if (!book || !catalog?.entries?.length) return null;
    return pickReaderWorkspaceMap(book, chapter, catalog.entries) ?? null;
  }, [book, chapter, catalog]);

  const pinnedPlacesOnPlate = useMemo(() => {
    if (!currentPlate) return [];
    return Object.values(loadPlaces()).filter((p) => p.atlasPin?.catalogMapId === currentPlate.id);
  }, [currentPlate?.id, routesVersion, placesRefresh, workspaceEpoch]);

  const plateRoutes = useMemo(() => {
    if (!currentPlate) return [];
    return routesForCatalogMapId(loadAtlasRoutes(), currentPlate.id);
  }, [currentPlate?.id, routesVersion, workspaceEpoch]);

  const setBookChapter = (nextBook: string, nextChapter: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextBook) {
      nextParams.set("book", nextBook);
      nextParams.set("chapter", String(Math.max(1, nextChapter)));
    } else {
      nextParams.delete("book");
      nextParams.delete("chapter");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const addRouteBetweenPlaces = () => {
    if (!currentPlate || !routeFromId || !routeToId || routeFromId === routeToId) return;
    const places = loadPlaces();
    const a = places[routeFromId];
    const b = places[routeToId];
    if (!a?.atlasPin || !b?.atlasPin) return;
    if (a.atlasPin.catalogMapId !== currentPlate.id || b.atlasPin.catalogMapId !== currentPlate.id) return;
    const route: AtlasRoute = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `route-${Date.now()}`,
      catalogMapId: currentPlate.id,
      label: routeLabel.trim() || `${a.name} → ${b.name}`,
      points: [
        { nx: a.atlasPin.nx, ny: a.atlasPin.ny },
        { nx: b.atlasPin.nx, ny: b.atlasPin.ny },
      ],
    };
    addAtlasRoute(route);
    setRoutesVersion((v) => v + 1);
  };

  const deleteRoute = (id: string) => {
    removeAtlasRoute(id);
    setRoutesVersion((v) => v + 1);
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[#1a2744] text-neutral-100">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
        <Button type="button" variant="ghost" size="sm" asChild className="text-neutral-200 hover:bg-white/10 hover:text-white">
          <Link to="/scripture/flow" className="gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Sermon map
          </Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild className="text-neutral-200 hover:bg-white/10 hover:text-white">
          <Link to="/" className="gap-2">
            Reader
          </Link>
        </Button>
        <span className="ml-auto flex items-center gap-2 text-xs font-medium text-neutral-400">
          <Map className="h-4 w-4 text-amber-400/90" strokeWidth={2} aria-hidden />
          Atlas plates
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-w-0 lg:flex-[1.35]">
          <div className="flex shrink-0 gap-0.5 border-b border-white/10 bg-[#141c2e] p-1.5">
            <button
              type="button"
              onClick={() => setMainView("workspace")}
              className={`flex-1 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                mainView === "workspace"
                  ? "bg-[#1a2744] text-neutral-50 shadow-sm ring-1 ring-white/10"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Workspace plates
            </button>
            <button
              type="button"
              onClick={() => setMainView("book-cities")}
              className={`flex-1 rounded-md px-2 py-2 text-center text-[11px] font-semibold transition-colors ${
                mainView === "book-cities"
                  ? "bg-[#1a2744] text-neutral-50 shadow-sm ring-1 ring-white/10"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Book cities
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {mainView === "workspace" ? (
              <WorkspaceMapsGallery variant="page" />
            ) : book ? (
              <BookCitiesSimpleMap book={book} chapter={chapter} panelTone="dark" />
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-neutral-400">
                Choose a book in the sidebar to show places that appear in that book (from the built-in location list).
              </div>
            )}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col border-white/10 bg-[#141c2e] lg:w-[min(22rem,32vw)] lg:max-w-sm lg:flex-none lg:border-l xl:w-80">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Clock className="h-4 w-4 text-amber-400/80" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">When you read</span>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            <div>
              <label htmlFor="map-book" className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Book
              </label>
              <select
                id="map-book"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#1a2744] px-2 py-2 text-sm text-neutral-100"
                value={book || ""}
                onChange={(e) => {
                  const b = e.target.value;
                  if (b) setBookChapter(b, 1);
                  else setBookChapter("", 1);
                }}
              >
                <option value="">Choose a book…</option>
                {CANON_BOOKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            {book ? (
              <div>
                <label htmlFor="map-chapter" className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Chapter (reference)
                </label>
                <input
                  id="map-chapter"
                  type="number"
                  min={1}
                  max={CHAPTER_COUNT[book as keyof typeof CHAPTER_COUNT] ?? 150}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#1a2744] px-2 py-2 text-sm text-neutral-100"
                  value={chapter}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n)) return;
                    setBookChapter(book, n);
                  }}
                />
              </div>
            ) : null}

            {book && ctx ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Historical setting</p>
                <p className="mt-2 font-serif text-lg font-semibold text-neutral-50">
                  {book}
                  {chapter ? ` ${chapter}` : ""}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-300">{ctx.summary}</p>
                <p className="mt-2 text-[11px] font-medium text-amber-100/90">{ctx.approximateRange}</p>
                {ctx.worldStage ? <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{ctx.worldStage}</p> : null}
              </div>
            ) : book && !ctx ? (
              <p className="text-xs text-neutral-500">No historical blurb for this book title yet.</p>
            ) : (
              <p className="text-xs leading-relaxed text-neutral-500">
                Pick a book for a short historical note while you browse your atlas plates.
              </p>
            )}

            {currentPlate ? (
              <div className="rounded-xl border border-white/10 bg-[#1a2744] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Plate for this reference</p>
                <p className="mt-1 text-xs text-neutral-200">{currentPlate.title}</p>
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
                  Reader sidebar uses the same plate. Pins and routes you save here appear on that map when the plate matches.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 w-full text-[10px] text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                  onClick={() => setPlacesRefresh((n) => n + 1)}
                >
                  Reload place pins
                </Button>
              </div>
            ) : null}

            {currentPlate ? (
              <div className="rounded-xl border border-teal-500/25 bg-teal-950/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-200/90">Routes on this plate</p>
                {plateRoutes.length === 0 ? (
                  <p className="mt-2 text-[11px] text-neutral-500">No routes yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {plateRoutes.map((r) => (
                      <li key={r.id} className="flex items-start justify-between gap-2 text-[11px] text-neutral-300">
                        <span className="min-w-0">{r.label || "Route"}</span>
                        <button type="button" className="shrink-0 text-rose-300 hover:underline" onClick={() => deleteRoute(r.id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Connect two places</p>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">
                  Both places need an atlas pin on this exact plate (edit each place → Atlas map pin).
                </p>
                {pinnedPlacesOnPlate.length >= 2 ? (
                  <>
                    <select
                      value={routeFromId}
                      onChange={(e) => setRouteFromId(e.target.value)}
                      className="mt-2 w-full rounded border border-white/10 bg-[#0f1420] px-2 py-1.5 text-xs text-neutral-100"
                    >
                      <option value="">From…</option>
                      {pinnedPlacesOnPlate.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={routeToId}
                      onChange={(e) => setRouteToId(e.target.value)}
                      className="mt-2 w-full rounded border border-white/10 bg-[#0f1420] px-2 py-1.5 text-xs text-neutral-100"
                    >
                      <option value="">To…</option>
                      {pinnedPlacesOnPlate.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={routeLabel}
                      onChange={(e) => setRouteLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className="mt-2 w-full rounded border border-white/10 bg-[#0f1420] px-2 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-2 w-full bg-teal-800/80 text-white hover:bg-teal-700"
                      onClick={addRouteBetweenPlaces}
                    >
                      Add route
                    </Button>
                  </>
                ) : (
                  <p className="mt-2 text-[11px] text-neutral-500">Pin at least two places on this plate to draw a line between them.</p>
                )}
              </div>
            ) : null}

            <Button type="button" variant="outline" size="sm" asChild className="w-full border-white/15 bg-transparent text-neutral-200 hover:bg-white/10 hover:text-white">
              <Link
                to={book ? `/?tab=index&book=${encodeURIComponent(book)}&chapter=${String(chapter)}` : "/?tab=index"}
              >
                Back to reader
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
