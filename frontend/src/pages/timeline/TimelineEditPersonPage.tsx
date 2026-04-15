import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { fetchWorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import type { PersonProfile } from "@/lib/timelinePeople";
import { loadPeopleProfiles, savePeopleProfiles } from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

import { TimelineEditPersonForm } from "./TimelineForms";
import type { PersonTimelineSavePatch } from "./TimelineForms";

export function TimelineEditPersonPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const events = useTimelineStore((s) => s.events);
  const loading = useTimelineStore((s) => s.loading);
  const eventsHydrated = useTimelineStore((s) => s.eventsHydrated);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const [profiles, setProfiles] = useState<Record<string, PersonProfile>>(() =>
    typeof window !== "undefined" ? loadPeopleProfiles() : {},
  );
  const [mapCatalogEntries, setMapCatalogEntries] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchWorkspaceMapCatalog().then((data) => {
      if (cancelled) return;
      setMapCatalogEntries((data.entries ?? []).map((e) => ({ id: e.id, title: e.title })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const peopleOptions = useMemo(
    () =>
      events
        .filter((e) => (e.type === "person" || e.type === "ruler") && e.id !== eventId)
        .map((e) => ({ eventId: e.id, label: profiles[e.id]?.name ?? e.title })),
    [events, eventId, profiles],
  );

  const person = useMemo(() => {
    if (!eventId) return null;
    const ev = events.find((e) => e.id === eventId && (e.type === "person" || e.type === "ruler"));
    if (!ev) return null;
    const profile =
      profiles[ev.id] ??
      ({
        eventId: ev.id,
        name: ev.title,
        scope: "bible" as const,
      } satisfies PersonProfile);
    return { event: ev, profile };
  }, [eventId, events, profiles]);

  const mergeProfile = (id: string, patch: Partial<PersonProfile>): boolean => {
    let ok = true;
    setProfiles((prev) => {
      const existing = prev[id] ?? { eventId: id, name: patch.name ?? "Unknown", scope: "bible" as const };
      const next = { ...prev, [id]: { ...existing, ...patch } };
      ok = savePeopleProfiles(next);
      if (!ok) {
        queueMicrotask(() =>
          window.alert(
            "Could not save this profile in browser storage (storage may be full). Remove or replace large images, then try Save again.",
          ),
        );
      }
      return next;
    });
    return ok;
  };

  if (!eventId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Missing person id.</p>
        <Link to="/people" className="mt-2 inline-block text-primary">
          Back
        </Link>
      </div>
    );
  }

  if (!person) {
    if (!eventsHydrated || loading) {
      return (
        <div className="p-8">
          <p className="text-sm text-muted-foreground">Loading timeline…</p>
        </div>
      );
    }
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Person not found.</p>
        <Button type="button" variant="link" className="mt-2 px-0" asChild>
          <Link to="/people">Back to people</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={`/timeline/person/${eventId}`}>← Profile</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Edit person</h1>
        <p className="mt-1 text-sm text-muted-foreground">{person.profile.name || person.event.title}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-2xl pb-8">
        <TimelineEditPersonForm
          person={person}
          peopleOptions={peopleOptions}
          mapCatalogEntries={mapCatalogEntries}
          onCancel={() => navigate(`/timeline/person/${eventId}`)}
          onSave={async (id, patch, timeline: PersonTimelineSavePatch) => {
            try {
              await api.patch(`/timeline/events/${id}`, timeline);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Could not update timeline";
              window.alert(msg);
              return;
            }
            if (!mergeProfile(id, patch)) return;
            await fetchEvents();
            navigate(`/timeline/person/${id}`);
          }}
        />
        </div>
      </div>
    </div>
  );
}
