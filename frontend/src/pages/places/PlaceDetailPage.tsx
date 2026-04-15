import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PlaceLorePanel } from "@/components/places/PlaceLorePanel";
import { Button } from "@/components/ui/button";
import { loadPlaces, type PlaceRecord } from "@/lib/places";
import { useTimelineStore } from "@/store/timelineStore";

export function PlaceDetailPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const events = useTimelineStore((s) => s.events);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);
  const [place, setPlace] = useState<PlaceRecord | null>(null);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!placeId) {
      setPlace(null);
      return;
    }
    const all = loadPlaces();
    setPlace(all[placeId] ?? null);
  }, [placeId]);

  const relatedEvents = useMemo(() => {
    if (!place?.relatedTimelineEventIds?.length) return [];
    const set = new Set(place.relatedTimelineEventIds);
    return events.filter((e) => set.has(e.id));
  }, [place, events]);

  if (!placeId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Missing place id.</p>
        <Link to="/places" className="mt-2 text-primary">
          Back
        </Link>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Place not found.</p>
        <Button type="button" variant="link" className="mt-2 px-0" asChild>
          <Link to="/places">Back to places</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f0fdfa]">
      <div className="shrink-0 border-b border-teal-900/15 bg-card px-4 py-3 sm:px-8 lg:px-12">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/places">← Places</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={`/places/${placeId}/edit`}>Edit place</Link>
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="min-h-min w-full border-x border-teal-900/10 bg-[#f0fdfa] shadow-sm">
          <PlaceLorePanel place={place} relatedEvents={relatedEvents} />
        </div>
      </div>
    </div>
  );
}
