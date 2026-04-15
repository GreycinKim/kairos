import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PersonLorePanel } from "@/components/timeline/PersonLorePanel";
import { Button } from "@/components/ui/button";
import type { PersonProfile } from "@/lib/timelinePeople";
import { loadPeopleProfiles } from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

export function TimelinePersonPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const events = useTimelineStore((s) => s.events);

  const data = useMemo(() => {
    if (!eventId) return null;
    const ev = events.find((e) => e.id === eventId && (e.type === "person" || e.type === "ruler"));
    if (!ev) return null;
    const profiles = typeof window !== "undefined" ? loadPeopleProfiles() : {};
    const profile =
      profiles[ev.id] ??
      ({
        eventId: ev.id,
        name: ev.title,
        scope: "bible" as const,
      } satisfies PersonProfile);
    return { event: ev, profile };
  }, [eventId, events]);

  if (!eventId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Missing id.</p>
        <Link to="/people" className="mt-2 text-primary">
          Back
        </Link>
      </div>
    );
  }

  if (!data) {
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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#faf7f2]">
      <div className="shrink-0 border-b border-rose-900/15 bg-card px-4 py-3 sm:px-8 lg:px-12">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/people">← People</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/timeline/person/${eventId}/edit`}>Edit profile</Link>
            </Button>
            <Button type="button" size="sm" asChild>
              <Link to={`/timeline/event/${eventId}`}>Notes &amp; settings</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="min-h-min w-full border-x border-rose-900/10 bg-[#faf7f2] shadow-sm">
          <PersonLorePanel event={data.event} profile={data.profile} />
        </div>
      </div>
    </div>
  );
}
