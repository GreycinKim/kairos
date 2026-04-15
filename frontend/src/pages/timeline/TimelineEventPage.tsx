import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ScriptureCrossLinksBlock } from "@/components/scripture/ScriptureCrossLinksBlock";
import { EventNotesWorkspace } from "@/components/timeline/EventNotesWorkspace";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { deepDivePathForEvent } from "@/lib/timelineDeepLink";
import {
  deleteEventScriptureEntry,
  getScripturesForTimelineEvent,
  loadEventScripture,
  saveEventScripture,
  setScripturesForTimelineEvent,
} from "@/lib/eventScripture";
import {
  loadEventDisplay,
  saveEventDisplay,
  type EventDisplayOverride,
} from "@/lib/timelineEventDisplay";
import {
  loadPeopleProfiles,
  savePeopleProfiles,
  type PersonProfile,
  type ScriptureAppearance,
} from "@/lib/timelinePeople";
import { ScriptureAppearanceRowForm } from "@/pages/timeline/TimelineForms";
import { useTimelineStore } from "@/store/timelineStore";

export function TimelineEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const events = useTimelineStore((s) => s.events);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);
  const selectEvent = useTimelineStore((s) => s.selectEvent);

  const [profiles, setProfiles] = useState<Record<string, PersonProfile>>(() =>
    typeof window !== "undefined" ? loadPeopleProfiles() : {},
  );
  const [eventDisplay, setEventDisplay] = useState<Record<string, EventDisplayOverride>>(() =>
    typeof window !== "undefined" ? loadEventDisplay() : {},
  );
  const [eventScripture, setEventScripture] = useState(() => (typeof window !== "undefined" ? loadEventScripture() : {}));
  const [scriptureDraft, setScriptureDraft] = useState<ScriptureAppearance[]>([]);

  useEffect(() => {
    savePeopleProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    saveEventDisplay(eventDisplay);
  }, [eventDisplay]);

  useEffect(() => {
    saveEventScripture(eventScripture);
  }, [eventScripture]);

  const event = useMemo(() => (eventId ? events.find((e) => e.id === eventId) ?? null : null), [events, eventId]);

  useEffect(() => {
    if (!eventId) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const prof = loadPeopleProfiles()[ev.id];
    setScriptureDraft([...getScripturesForTimelineEvent(ev, prof, eventScripture)]);
  }, [eventId, events, eventScripture]);

  useEffect(() => {
    if (eventId) selectEvent(eventId);
    return () => selectEvent(null);
  }, [eventId, selectEvent]);

  const getAvatarUrl = (id: string) => profiles[id]?.imageDataUrl ?? eventDisplay[id]?.imageDataUrl ?? null;

  const patchEventImage = (id: string, dataUrl: string | null) => {
    const ev = events.find((e) => e.id === id);
    if (ev?.type === "person" || ev?.type === "ruler") {
      setProfiles((prev) => {
        const existing = prev[id] ?? { eventId: id, name: ev.title, scope: "bible" as const };
        const next = { ...prev, [id]: { ...existing, imageDataUrl: dataUrl ?? undefined } };
        savePeopleProfiles(next);
        return next;
      });
      setEventDisplay((prev) => {
        const next = { ...prev };
        delete next[id];
        saveEventDisplay(next);
        return next;
      });
      return;
    }
    setEventDisplay((prev) => {
      const next = { ...prev };
      if (!dataUrl) delete next[id];
      else next[id] = { imageDataUrl: dataUrl };
      saveEventDisplay(next);
      return next;
    });
  };

  const removeEvent = async (id: string) => {
    await api.delete(`/timeline/events/${id}`);
    setProfiles((prev) => {
      const next: Record<string, PersonProfile> = { ...prev };
      delete next[id];
      for (const k of Object.keys(next)) {
        const cur = next[k];
        const rel = cur?.relatedEventIds;
        if (rel?.length && cur) {
          next[k] = { ...cur, relatedEventIds: rel.filter((x) => x !== id) };
        }
      }
      savePeopleProfiles(next);
      return next;
    });
    setEventDisplay((prev) => {
      const next = { ...prev };
      delete next[id];
      saveEventDisplay(next);
      return next;
    });
    setEventScripture((prev) => deleteEventScriptureEntry(prev, id));
    await fetchEvents();
    navigate("/timeline");
  };

  const isPersonOrRuler = event?.type === "person" || event?.type === "ruler";

  const passagesForLinks = useMemo(() => {
    if (!event) return [];
    if (event.type === "person" || event.type === "ruler") {
      return getScripturesForTimelineEvent(event, profiles[event.id], eventScripture);
    }
    return scriptureDraft;
  }, [event, profiles, eventScripture, scriptureDraft]);

  const persistScriptureDraft = useCallback(() => {
    if (!eventId) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev || ev.type === "person" || ev.type === "ruler") return;
    setEventScripture((prev) => setScripturesForTimelineEvent(prev, ev, scriptureDraft));
  }, [eventId, events, scriptureDraft]);

  if (!eventId) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Missing event id.</p>
        <Link to="/timeline" className="mt-2 text-primary">
          Back
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Event not found or still loading.</p>
        <Button type="button" variant="link" className="mt-2 px-0" asChild>
          <Link to="/timeline">Back to timeline</Link>
        </Button>
      </div>
    );
  }

  const deep = deepDivePathForEvent(event);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/timeline">← Timeline</Link>
        </Button>
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EventNotesWorkspace
            event={event}
            deepDivePath={deep}
            onDeleteEvent={removeEvent}
            eventImageUrl={getAvatarUrl(event.id)}
            onEventImageChange={(dataUrl) => patchEventImage(event.id, dataUrl)}
          />
        </div>
        <div className="shrink-0 border-t border-border bg-muted/15 px-4 py-5 sm:px-6">
          <h3 className="text-sm font-semibold text-foreground">Scripture links</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tag book and chapter so this entry lines up with people and places that reference the same passages.
          </p>
          {isPersonOrRuler ? (
            <p className="mt-3 text-sm text-muted-foreground">
              For people and rulers, edit the{" "}
              <Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/timeline/person/${event.id}/edit`}>
                scripture footprint on the person profile
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {scriptureDraft.length === 0 ? (
                <p className="text-xs text-muted-foreground">No passages yet.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {scriptureDraft.map((row, i) => (
                    <li
                      key={`${row.book}-${row.chapter}-${i}`}
                      className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2 py-1.5"
                    >
                      <span>
                        {row.book} {row.chapter}
                      </span>
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => setScriptureDraft((a) => a.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <ScriptureAppearanceRowForm
                onAddPassages={(rows) => {
                  setScriptureDraft((a) => [...a, ...rows]);
                }}
              />
              <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={persistScriptureDraft}>
                Save scripture links
              </Button>
            </div>
          )}
          <div className="mt-6 border-t border-border pt-5">
            <ScriptureCrossLinksBlock
              passages={passagesForLinks}
              excludeEventId={event.id}
              title="Also tagged to these passages"
              description="People, places, and other timeline events that share these book and chapter rows."
            />
            {passagesForLinks.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {isPersonOrRuler
                  ? "Add a scripture footprint on the person profile to discover related places and events."
                  : "Add passages and save to discover cross-links."}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
