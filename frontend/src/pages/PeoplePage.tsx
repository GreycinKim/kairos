import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { loadEventScripture, pruneEventScriptureForEventIds, saveEventScripture } from "@/lib/eventScripture";
import {
  figureKindSortIndex,
  loadPeopleProfiles,
  PERSON_FIGURE_KIND_LABELS,
  profileAppearsInBook,
  savePeopleProfiles,
  toYearLabel,
  type PersonProfile,
} from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

function pruneProfilesAfterEventDeletes(
  profiles: Record<string, PersonProfile>,
  removedIds: Set<string>,
): Record<string, PersonProfile> {
  const next: Record<string, PersonProfile> = { ...profiles };
  for (const id of removedIds) delete next[id];
  for (const k of Object.keys(next)) {
    const cur = next[k];
    if (!cur) continue;
    let dirty = false;
    const nextCur: PersonProfile = { ...cur };
    if (cur.relatedEventIds?.some((id) => removedIds.has(id))) {
      const rel = cur.relatedEventIds.filter((id) => !removedIds.has(id));
      nextCur.relatedEventIds = rel.length ? rel : undefined;
      dirty = true;
    }
    if (cur.familyLinks?.some((l) => removedIds.has(l.personEventId))) {
      const fam = cur.familyLinks.filter((l) => !removedIds.has(l.personEventId));
      nextCur.familyLinks = fam.length ? fam : undefined;
      dirty = true;
    }
    if (dirty) next[k] = nextCur;
  }
  return next;
}

export function PeoplePage() {
  const events = useTimelineStore((s) => s.events);
  const loading = useTimelineStore((s) => s.loading);
  const error = useTimelineStore((s) => s.error);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);
  const selectEvent = useTimelineStore((s) => s.selectEvent);
  const selectedEventId = useTimelineStore((s) => s.selectedEventId);

  const [search, setSearch] = useState("");
  const [peopleScopeFilter, setPeopleScopeFilter] = useState<"all" | "bible" | "church_history">("all");
  const [scriptureBook, setScriptureBook] = useState("");
  const [scriptureChapter, setScriptureChapter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, PersonProfile>>(() =>
    typeof window !== "undefined" ? loadPeopleProfiles() : {},
  );
  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    savePeopleProfiles(profiles);
  }, [profiles]);

  const people = useMemo(() => {
    const list = events.filter((e) => e.type === "person" || e.type === "ruler");
    const withMeta = list.map((e) => ({
      event: e,
      profile: profiles[e.id] ?? {
        eventId: e.id,
        name: e.title,
        scope: "bible" as const,
      },
    }));
    const scoped =
      peopleScopeFilter === "all" ? withMeta : withMeta.filter((x) => x.profile.scope === peopleScopeFilter);
    const q = search.trim().toLowerCase();
    const searched = !q
      ? scoped
      : scoped.filter(({ event, profile }) =>
          [profile.name, profile.title, profile.biography, event.title, event.description, event.era]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q)),
        );
    const byScripture =
      scriptureBook.trim() === ""
        ? searched
        : searched.filter(({ profile }) => {
            const ch = parseInt(scriptureChapter.trim(), 10);
            if (Number.isFinite(ch) && ch >= 1) {
              const rows = profile.scriptureAppearances ?? [];
              return rows.some((r) => r.book === scriptureBook && r.chapter === ch);
            }
            return profileAppearsInBook(profile, scriptureBook);
          });
    return byScripture.sort((a, b) => {
      const da = figureKindSortIndex(a.profile.figureKind);
      const db = figureKindSortIndex(b.profile.figureKind);
      if (da !== db) return da - db;
      return (a.profile.name || a.event.title || "").localeCompare(b.profile.name || b.event.title || "");
    });
  }, [events, profiles, peopleScopeFilter, search, scriptureBook, scriptureChapter]);

  const removeEvent = async (eventId: string) => {
    await api.delete(`/timeline/events/${eventId}`);
    setProfiles((prev) => pruneProfilesAfterEventDeletes(prev, new Set([eventId])));
    setSelectedIds((prev) => {
      if (!prev.has(eventId)) return prev;
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    if (selectedEventId === eventId) selectEvent(null);
    const es = loadEventScripture();
    saveEventScripture(pruneEventScriptureForEventIds(es, new Set([eventId])));
    await fetchEvents();
  };

  const toggleSelect = useCallback((eventId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(eventId);
      else next.delete(eventId);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const { event } of people) next.add(event.id);
      return next;
    });
  }, [people]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const removeSelectedPeople = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const labels = ids
      .map((id) => {
        const row = people.find((p) => p.event.id === id);
        return row ? row.profile.name || row.event.title : id;
      })
      .slice(0, 8);
    const more = ids.length > 8 ? ` and ${ids.length - 8} more` : "";
    if (!window.confirm(`Delete ${ids.length} people from the timeline?${labels.length ? `\n\nIncludes: ${labels.join(", ")}${more}.` : ""}\n\nThis cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    const succeeded = new Set<string>();
    const failed: { id: string; error: string }[] = [];
    for (const eventId of ids) {
      try {
        await api.delete(`/timeline/events/${eventId}`);
        succeeded.add(eventId);
      } catch (e) {
        failed.push({ id: eventId, error: e instanceof Error ? e.message : "Request failed" });
      }
    }
    if (succeeded.size) {
      setProfiles((prev) => pruneProfilesAfterEventDeletes(prev, succeeded));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of succeeded) next.delete(id);
        return next;
      });
      if (selectedEventId && succeeded.has(selectedEventId)) selectEvent(null);
      const es = loadEventScripture();
      saveEventScripture(pruneEventScriptureForEventIds(es, succeeded));
      await fetchEvents();
    }
    setBulkBusy(false);
    if (failed.length) {
      window.alert(`Could not delete ${failed.length} row(s):\n${failed.map((f) => `${f.id}: ${f.error}`).join("\n")}`);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-8">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">People</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Profiles, lore, and scripture footprints — linked to the timeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button type="button" size="sm" variant="outline" className="sm:h-10 sm:px-5 sm:text-sm" asChild>
            <Link to="/timeline">Timeline</Link>
          </Button>
          {loading ? <span className="text-xs text-muted-foreground">Syncing…</span> : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
          <Button type="button" size="sm" variant="outline" className="sm:h-10 sm:px-5 sm:text-sm" asChild>
            <Link to="/timeline/person/new">Add person</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" className="sm:h-10 sm:px-3 sm:text-sm" asChild>
            <Link to="/timeline/import">Import JSON</Link>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4 pb-3 pt-1 sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people by name, title, bio, era..."
                className="max-w-md"
              />
              <select
                value={peopleScopeFilter}
                onChange={(e) => setPeopleScopeFilter(e.target.value as "all" | "bible" | "church_history")}
                className="apple-field w-auto"
              >
                <option value="all">All scopes</option>
                <option value="bible">Genesis to Revelation</option>
                <option value="church_history">Church history</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setProfiles((prev) => {
                    const next = { ...prev };
                    events
                      .filter((e) => (e.type === "person" || e.type === "ruler") && (next[e.id]?.scope ?? "bible") === "bible")
                      .forEach((e) => {
                        const ex = next[e.id] ?? { eventId: e.id, name: e.title, scope: "bible" as const };
                        next[e.id] = { ...ex, hidden: false };
                      });
                    return next;
                  })
                }
              >
                Show all Bible people
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setProfiles((prev) => {
                    const next = { ...prev };
                    events
                      .filter((e) => (e.type === "person" || e.type === "ruler") && (next[e.id]?.scope ?? "bible") === "bible")
                      .forEach((e) => {
                        const ex = next[e.id] ?? { eventId: e.id, name: e.title, scope: "bible" as const };
                        next[e.id] = { ...ex, hidden: true };
                      });
                    return next;
                  })
                }
              >
                Hide all Bible people
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Book (66)</label>
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
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Chapter</label>
                <Input
                  value={scriptureChapter}
                  onChange={(e) => setScriptureChapter(e.target.value)}
                  placeholder="Any"
                  className="h-9 w-20 text-sm"
                  inputMode="numeric"
                  disabled={!scriptureBook}
                />
              </div>
              <p className="max-w-md pb-1 text-[11px] text-neutral-600">
                Narrows to people with that book (and chapter, if set) on their <span className="font-medium">Scripture footprint</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4 sm:px-8">
          <div className="mx-auto mb-3 flex w-full max-w-6xl flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={selectAllVisible} disabled={!people.length}>
              Select visible
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={clearSelection} disabled={!selectedIds.size}>
              Clear selection
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => void removeSelectedPeople()}
              disabled={!selectedIds.size || bulkBusy}
            >
              {bulkBusy ? "Deleting…" : `Delete selected (${selectedIds.size})`}
            </Button>
          </div>
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people.map(({ event, profile }) => (
              <article key={`person-card-${event.id}`} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300"
                    checked={selectedIds.has(event.id)}
                    onChange={(e) => toggleSelect(event.id, e.target.checked)}
                    aria-label={`Select ${profile.name || event.title}`}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {profile.imageDataUrl ? (
                      <img src={profile.imageDataUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-neutral-300 object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-xl">
                        {event.icon ?? "👤"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{profile.name || event.title}</p>
                      <p className="truncate text-xs text-neutral-500">
                        <span className="font-medium text-neutral-600">{PERSON_FIGURE_KIND_LABELS[profile.figureKind ?? "other"]}</span>
                        {" · "}
                        {event.start_year != null ? toYearLabel(event.start_year) : "Unknown start"}
                        {event.end_year != null ? ` - ${toYearLabel(event.end_year)}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-neutral-600">{profile.title || "No title yet."}</p>
                <p className="mt-1 line-clamp-3 text-xs text-neutral-500">{profile.biography || "No biography yet."}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-neutral-600">
                  <span>Died: {toYearLabel(profile.diedYear)}</span>
                  <span>
                    Ruled: {profile.ruledFromYear != null ? toYearLabel(profile.ruledFromYear) : "Unknown"} -{" "}
                    {profile.ruledToYear != null ? toYearLabel(profile.ruledToYear) : "Unknown"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="secondary" className="h-auto px-2 py-1 text-xs" asChild>
                    <Link to={`/timeline/person/${event.id}`}>Open lore</Link>
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-auto px-2 py-1 text-xs" asChild>
                    <Link to={`/timeline/person/${event.id}/edit`}>Edit person</Link>
                  </Button>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                    onClick={() => {
                      if (window.confirm(`Delete "${profile.name || event.title}"?`)) {
                        void removeEvent(event.id);
                      }
                    }}
                  >
                    Delete person
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
