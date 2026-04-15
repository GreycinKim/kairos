import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useTimelineStore } from "@/store/timelineStore";

import { TimelineAddEventForm } from "./TimelineForms";

export function TimelineNewEventPage() {
  const navigate = useNavigate();
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/timeline">← Timeline</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">New timeline event</h1>
        <p className="mt-1 text-sm text-muted-foreground">Milestones, books, empires, journal markers, and more.</p>
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-8">
        <TimelineAddEventForm
          onCancel={() => navigate("/timeline")}
          onCreated={async () => {
            await fetchEvents();
            navigate("/timeline");
          }}
        />
      </div>
    </div>
  );
}
