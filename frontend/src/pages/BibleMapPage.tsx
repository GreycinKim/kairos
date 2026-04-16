import { ArrowLeft, Clock, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { WorkspaceMapsGallery } from "@/components/maps/WorkspaceMapsGallery";
import { Button } from "@/components/ui/button";
import { CHAPTER_COUNT } from "@/lib/bibleCanon";
import { getBookHistoricalContext } from "@/lib/bookHistoricalContext";
import { loadPlaces } from "@/lib/places";
import type { WorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import { fetchWorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import { pickReaderWorkspaceMap } from "@/lib/workspaceMapReaderMatch";

const CANON_BOOKS = Object.keys(CHAPTER_COUNT) as (keyof typeof CHAPTER_COUNT)[];

export function BibleMapPage() {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<WorkspaceMapCatalog | null>(null);
  const [placesRefresh, setPlacesRefresh] = useState(0);

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
  }, [currentPlate?.id, placesRefresh, workspaceEpoch]);

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
          <div className="min-h-0 flex-1 overflow-hidden">
            {book ? (
              <WorkspaceMapsGallery
                variant="reader"
                readerContext={`${book} ${chapter}`}
                matchBook={book}
                matchChapter={chapter}
              />
            ) : (
              <WorkspaceMapsGallery variant="page" />
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
                Pick a book to open the drag-and-drop atlas for that passage, or browse all plates in the main area.
              </p>
            )}

            {currentPlate ? (
              <div className="rounded-xl border border-white/10 bg-[#1a2744] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Plate for this reference</p>
                <p className="mt-1 text-xs text-neutral-200">{currentPlate.title}</p>
                <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">
                  Same plate as the reader. Drag people from the list onto the map; place pins on Places edit the same way.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 w-full text-[10px] text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                  onClick={() => setPlacesRefresh((n) => n + 1)}
                >
                  Reload pins
                </Button>
              </div>
            ) : null}

            {currentPlate && pinnedPlacesOnPlate.length ? (
              <div className="rounded-xl border border-white/10 bg-[#1a2744] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Places on this plate</p>
                <ul className="mt-2 space-y-1 text-[11px] text-neutral-300">
                  {pinnedPlacesOnPlate.map((p) => (
                    <li key={p.id}>
                      <Link to={`/places/${p.id}`} className="text-amber-200/90 underline hover:text-amber-100">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
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
