import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { PersonProfile } from "@/lib/timelinePeople";
import { loadPeopleProfiles, savePeopleProfiles } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { useTimelineStore } from "@/store/timelineStore";

import { TimelineAddPersonForm } from "./TimelineForms";

export function TimelineNewPersonPage() {
  const navigate = useNavigate();
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  const mergeProfile = (eventId: string, patch: Partial<PersonProfile>) => {
    const prev = loadPeopleProfiles();
    const existing = prev[eventId] ?? { eventId, name: patch.name ?? "Unknown", scope: "bible" as const };
    savePeopleProfiles({ ...prev, [eventId]: { ...existing, ...patch } });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/people">← People</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Add person</h1>
        <p className="mt-1 text-sm text-muted-foreground">Creates a timeline span and a local People profile.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-2xl pb-8">
        <TimelineAddPersonForm
          onCancel={() => navigate("/people")}
          onCreated={async (event: TimelineEvent, profile: Partial<PersonProfile>) => {
            mergeProfile(event.id, profile);
            await fetchEvents();
            navigate(`/timeline/person/${event.id}`);
          }}
        />
        </div>
      </div>
    </div>
  );
}
