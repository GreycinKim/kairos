import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { TimelineCanvas, type TimelineCanvasHandle } from "@/components/timeline/TimelineCanvas";
import { TimelineControls } from "@/components/timeline/TimelineControls";
import { TimelineFilters } from "@/components/timeline/TimelineFilters";
import { TimelineSearchChrome } from "@/components/timeline/TimelineSearchChrome";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { loadEventDisplay } from "@/lib/timelineEventDisplay";
import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import { loadPeopleProfiles, profileAppearsInAnyBookSet, savePeopleProfiles, type PersonProfile } from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

export function TimelinePage() {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const events = useTimelineStore((s) => s.events);
  const loading = useTimelineStore((s) => s.loading);
  const error = useTimelineStore((s) => s.error);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  const [search, setSearch] = useState("");
  const canvasRef = useRef<TimelineCanvasHandle>(null);
  const [profiles, setProfiles] = useState<Record<string, PersonProfile>>(() =>
    typeof window !== "undefined" ? loadPeopleProfiles() : {},
  );
  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setProfiles(loadPeopleProfiles());
  }, [events, workspaceEpoch]);

  useEffect(() => {
    if (searchParams.get("tab") === "people") {
      navigate("/people", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!searchParams.get("tab")) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tab");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    savePeopleProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    const eid = searchParams.get("event");
    if (!eid || loading) return;
    const ev = events.find((x) => x.id === eid);
    const next = new URLSearchParams(searchParams);
    next.delete("event");
    next.delete("tab");
    const suffix = next.toString() ? `?${next.toString()}` : "";
    if (!ev) {
      navigate(`/timeline${suffix}`, { replace: true });
      return;
    }
    if (ev.type === "person" || ev.type === "ruler") {
      navigate(`/timeline/person/${eid}${suffix}`, { replace: true });
    } else {
      navigate(`/timeline/event/${eid}${suffix}`, { replace: true });
    }
  }, [searchParams, events, loading, navigate]);

  const fuse = useMemo(
    () =>
      new Fuse(events, {
        keys: ["title", "description", "era", "author"],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [events],
  );

  const visible = useMemo(() => {
    const q = search.trim();
    const base = !q ? events : fuse.search(q).map((r) => r.item);
    return base.filter((ev) => {
      if (ev.type !== "person" && ev.type !== "ruler") return true;
      return !profiles[ev.id]?.hidden;
    });
  }, [events, fuse, search, profiles]);

  const timelineBookFilter = useMemo(() => {
    const s = new Set<string>();
    for (const b of searchParams.getAll("book")) {
      const t = b.trim();
      if (t) s.add(t);
    }
    return s;
  }, [searchParams]);

  const selectedCanonBooks = useMemo(() => {
    const books = [...timelineBookFilter];
    books.sort((a, b) => {
      const ia = ALL_BIBLE_BOOKS.indexOf(a);
      const ib = ALL_BIBLE_BOOKS.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return books;
  }, [timelineBookFilter]);

  const timelineEventsForCanvas = useMemo(() => {
    if (timelineBookFilter.size === 0) return visible;
    return visible.filter((ev) => {
      if (ev.type === "bible_book") return timelineBookFilter.has(ev.title.trim());
      if (ev.type === "person" || ev.type === "ruler") {
        const prof =
          profiles[ev.id] ??
          ({
            eventId: ev.id,
            name: ev.title,
            scope: "bible" as const,
          } satisfies PersonProfile);
        return profileAppearsInAnyBookSet(prof, timelineBookFilter);
      }
      return false;
    });
  }, [visible, timelineBookFilter, profiles]);

  const toggleTimelineBookFilter = (book: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tab");
        const cur = new Set(next.getAll("book").map((x) => x.trim()).filter(Boolean));
        if (cur.has(book)) cur.delete(book);
        else cur.add(book);
        next.delete("book");
        for (const b of cur) next.append("book", b);
        return next;
      },
      { replace: true },
    );
  };

  const clearTimelineBookFilter = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("book");
        next.delete("tab");
        return next;
      },
      { replace: true },
    );
  };

  const focusSearch = () => {
    document.getElementById("kairos-timeline-search")?.focus();
  };

  const getAvatarUrl = (eventId: string): string | null => {
    const display = typeof window !== "undefined" ? loadEventDisplay() : {};
    return profiles[eventId]?.imageDataUrl ?? display[eventId]?.imageDataUrl ?? null;
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">Sacred timeline</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Scripture, history, and your milestones.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button type="button" size="sm" variant="outline" className="sm:h-10 sm:px-5 sm:text-sm" asChild>
            <Link to="/people">People</Link>
          </Button>
          {loading ? <span className="text-xs text-muted-foreground">Syncing…</span> : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
          <Button type="button" size="sm" variant="outline" className="sm:h-10 sm:px-5 sm:text-sm" asChild>
            <Link to="/timeline/person/new">Add person</Link>
          </Button>
          <Button type="button" size="sm" className="sm:h-10 sm:px-5 sm:text-sm" asChild>
            <Link to="/timeline/event/new">Add event</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" className="sm:h-10 sm:px-3 sm:text-sm" asChild>
            <Link to="/timeline/import">Import JSON</Link>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TimelineSearchChrome
            fillViewport
            variant="floating"
            tagline="Ctrl + wheel (or dominant vertical wheel) zooms toward the cursor; horizontal wheel pans sideways; drag empty space to pan in any direction. Fullscreen uses the button below the chart."
            onSearchFocus={focusSearch}
            onJumpToday={() => canvasRef.current?.scrollToToday()}
          >
            <TimelineCanvas
              ref={canvasRef}
              fillHeight
              events={timelineEventsForCanvas}
              getAvatarUrl={getAvatarUrl}
              onEventOpen={(id) => {
                const ev = events.find((e) => e.id === id);
                if (ev && (ev.type === "person" || ev.type === "ruler")) {
                  navigate(`/timeline/person/${id}`);
                  return;
                }
                navigate(`/timeline/event/${id}`);
              }}
            />
          </TimelineSearchChrome>
        </div>
        <div className="mx-auto w-full max-w-[min(100%,52rem)] shrink-0 space-y-4 px-4 pb-8 pt-1 sm:max-w-[min(100%,60rem)] sm:px-8">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="kairos-book-filter-add" className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Timeline — books
              </label>
              <select
                id="kairos-book-filter-add"
                className="apple-field h-9 max-w-[min(100%,14rem)] text-sm"
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  toggleTimelineBookFilter(v);
                  e.target.value = "";
                }}
              >
                <option value="">Add a book…</option>
                <optgroup label="Old Testament">
                  {ALL_BIBLE_BOOKS.slice(0, 39).map((b) => (
                    <option key={b} value={b} disabled={timelineBookFilter.has(b)}>
                      {b}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="New Testament">
                  {ALL_BIBLE_BOOKS.slice(39).map((b) => (
                    <option key={b} value={b} disabled={timelineBookFilter.has(b)}>
                      {b}
                    </option>
                  ))}
                </optgroup>
              </select>
              {timelineBookFilter.size > 0 ? (
                <button type="button" className="text-[11px] font-medium text-primary underline-offset-2 hover:underline" onClick={clearTimelineBookFilter}>
                  Clear books
                </button>
              ) : null}
            </div>
            {selectedCanonBooks.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedCanonBooks.map((b) => (
                  <button
                    key={`tb-book-${b}`}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted/80"
                    onClick={() => toggleTimelineBookFilter(b)}
                    title="Click to remove"
                  >
                    {b}
                    <span className="text-muted-foreground">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Add one or more books to show only those <span className="font-medium">bible_book</span> markers and people whose{" "}
                <span className="font-medium">Scripture footprint</span> includes any of those books.
              </p>
            )}
          </div>
          <TimelineControls search={search} onSearch={setSearch} />
          <TimelineFilters />
        </div>
      </div>
    </div>
  );
}
