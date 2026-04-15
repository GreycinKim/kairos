import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { loadPlaces, placeScriptureMentionsBook, placeScriptureMentionsChapter, savePlaces, type PlaceRecord } from "@/lib/places";

type LinkFilter = "all" | "linked" | "none";
type ImageFilter = "all" | "with" | "without";

export function PlacesPage() {
  const location = useLocation();
  const [places, setPlaces] = useState<Record<string, PlaceRecord>>(() =>
    typeof window !== "undefined" ? loadPlaces() : {},
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [scriptureBook, setScriptureBook] = useState("");
  const [scriptureChapter, setScriptureChapter] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [imageFilter, setImageFilter] = useState<ImageFilter>("all");

  useEffect(() => {
    setPlaces(loadPlaces());
  }, [location.key]);

  const regionOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of Object.values(places)) {
      const r = p.region?.trim();
      if (r) s.add(r);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [places]);

  const list = useMemo(() => {
    let rows = Object.values(places).sort((a, b) => a.name.localeCompare(b.name));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) =>
        [p.name, p.description, p.region].filter(Boolean).some((field) => String(field).toLowerCase().includes(q)),
      );
    }
    if (regionFilter) {
      rows = rows.filter((p) => (p.region ?? "").trim() === regionFilter);
    }
    if (scriptureBook.trim()) {
      const ch = parseInt(scriptureChapter.trim(), 10);
      if (Number.isFinite(ch) && ch >= 1) {
        rows = rows.filter((p) => placeScriptureMentionsChapter(p, scriptureBook, ch));
      } else {
        rows = rows.filter((p) => placeScriptureMentionsBook(p, scriptureBook));
      }
    }
    if (linkFilter === "linked") {
      rows = rows.filter((p) => (p.relatedTimelineEventIds?.length ?? 0) > 0);
    }
    if (linkFilter === "none") {
      rows = rows.filter((p) => !(p.relatedTimelineEventIds?.length ?? 0));
    }
    if (imageFilter === "with") {
      rows = rows.filter((p) => Boolean(p.imageDataUrl?.trim()));
    }
    if (imageFilter === "without") {
      rows = rows.filter((p) => !p.imageDataUrl?.trim());
    }
    return rows;
  }, [places, search, regionFilter, scriptureBook, scriptureChapter, linkFilter, imageFilter]);

  const allCount = useMemo(() => Object.keys(places).length, [places]);

  const hasActiveFilters =
    search.trim() !== "" ||
    regionFilter !== "" ||
    scriptureBook.trim() !== "" ||
    linkFilter !== "all" ||
    imageFilter !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setRegionFilter("");
    setScriptureBook("");
    setScriptureChapter("");
    setLinkFilter("all");
    setImageFilter("all");
  }, []);

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const p of list) next.add(p.id);
      return next;
    });
  }, [list]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const deleteSelectedPlaces = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const names = ids
      .map((id) => list.find((p) => p.id === id)?.name ?? places[id]?.name ?? id)
      .slice(0, 8);
    const more = ids.length > 8 ? ` and ${ids.length - 8} more` : "";
    if (
      !window.confirm(
        `Delete ${ids.length} place(s)?${names.length ? `\n\nIncludes: ${names.join(", ")}${more}.` : ""}\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }
    const all = loadPlaces();
    const next = { ...all };
    for (const id of ids) delete next[id];
    savePlaces(next);
    setPlaces(next);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Sacred places</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Explore locations and the scripture scenes and timeline events you link to them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="sm:h-10" asChild>
            <Link to="/timeline">Timeline</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" className="sm:h-10" asChild>
            <Link to="/places/import">Import JSON</Link>
          </Button>
          <Button type="button" size="sm" className="sm:h-10" asChild>
            <Link to="/places/new">Add place</Link>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {allCount === 0 ? (
          <p className="mx-auto max-w-lg px-4 py-10 text-sm text-muted-foreground sm:px-8">
            No places saved yet. Add a place to curate an image, description, scripture chapters, and links to your timeline events.
          </p>
        ) : (
          <>
            <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-8">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[12rem] flex-1">
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name, description, region…"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Region</label>
                    <select
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className="apple-field h-9 min-w-[10rem] text-sm"
                    >
                      <option value="">Any region</option>
                      {regionOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Timeline links</label>
                    <select
                      value={linkFilter}
                      onChange={(e) => setLinkFilter(e.target.value as LinkFilter)}
                      className="apple-field h-9 min-w-[10rem] text-sm"
                    >
                      <option value="all">Any</option>
                      <option value="linked">Has links</option>
                      <option value="none">No links</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Image</label>
                    <select
                      value={imageFilter}
                      onChange={(e) => setImageFilter(e.target.value as ImageFilter)}
                      className="apple-field h-9 min-w-[9rem] text-sm"
                    >
                      <option value="all">Any</option>
                      <option value="with">With image</option>
                      <option value="without">No image</option>
                    </select>
                  </div>
                  {hasActiveFilters ? (
                    <Button type="button" size="sm" variant="ghost" className="h-9" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Scripture book</label>
                    <select
                      value={scriptureBook}
                      onChange={(e) => {
                        setScriptureBook(e.target.value);
                        setScriptureChapter("");
                      }}
                      className="apple-field h-9 min-w-[10rem] text-sm"
                    >
                      <option value="">Any book</option>
                      <optgroup label="Old Testament">
                        {ALL_BIBLE_BOOKS.slice(0, 39).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="New Testament">
                        {ALL_BIBLE_BOOKS.slice(39).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Chapter</label>
                    <Input
                      value={scriptureChapter}
                      onChange={(e) => setScriptureChapter(e.target.value)}
                      placeholder="Any"
                      className="h-9 w-20 text-sm"
                      inputMode="numeric"
                      disabled={!scriptureBook}
                    />
                  </div>
                  <p className="max-w-md pb-1 text-[11px] text-muted-foreground">
                    Narrows to places that list this book (and chapter, if set) under <span className="font-medium">Scripture scenes</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-10 pt-4 sm:px-8">
              {list.length === 0 ? (
                <div className="mx-auto max-w-lg py-6">
                  <p className="text-sm text-muted-foreground">No places match these filters.</p>
                  {hasActiveFilters ? (
                    <Button type="button" size="sm" variant="outline" className="mt-3" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex w-full max-w-6xl flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={selectAllVisible}>
                      Select visible
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={clearSelection} disabled={!selectedIds.size}>
                      Clear selection
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelectedPlaces}
                      disabled={!selectedIds.size}
                    >
                      {`Delete selected (${selectedIds.size})`}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Showing {list.length} of {allCount}
                    </span>
                  </div>
                  <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((p) => (
                      <article
                        key={p.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
                      >
                        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 rounded border-border"
                            checked={selectedIds.has(p.id)}
                            onChange={(e) => toggleSelect(p.id, e.target.checked)}
                            aria-label={`Select ${p.name} for bulk delete`}
                          />
                        </div>
                        <Link
                          to={`/places/${p.id}`}
                          className="flex flex-1 flex-col text-left transition group-hover:border-teal-700/30"
                        >
                          <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                            {p.imageDataUrl ? (
                              <img src={p.imageDataUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">📍</div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="font-semibold text-foreground">{p.name}</p>
                            {p.region ? (
                              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-teal-800/90">{p.region}</p>
                            ) : null}
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description || "No description yet."}</p>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {(p.scriptureAppearances?.length ?? 0) + " scripture rows · "}
                              {(p.relatedTimelineEventIds?.length ?? 0) + " timeline links"}
                            </p>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
