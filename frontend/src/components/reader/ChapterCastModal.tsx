import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { Modal } from "@/components/shared/Modal";
import { loadEventScripture } from "@/lib/eventScripture";
import { listProfilesInChapter } from "@/lib/chapterCastMembers";
import { loadPlaces } from "@/lib/places";
import { collectCrossLinksForChapter } from "@/lib/scriptureConnections";
import { loadPeopleProfiles, type PersonProfile } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { useTimelineStore } from "@/store/timelineStore";

export function ChapterCastModal({
  open,
  onClose,
  book,
  chapter,
  onPickPerson,
}: {
  open: boolean;
  onClose: () => void;
  book: string;
  chapter: number;
  onPickPerson: (event: TimelineEvent, profile: PersonProfile) => void;
}) {
  const events = useTimelineStore((s) => s.events);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  useEffect(() => {
    if (open) void fetchEvents();
  }, [open, fetchEvents]);

  const rows = useMemo(() => {
    const profiles = loadPeopleProfiles();
    return listProfilesInChapter(events, profiles, book, chapter);
  }, [events, book, chapter, open]);

  const { placeLinks, eventLinks } = useMemo(() => {
    const profiles = loadPeopleProfiles();
    const places = loadPlaces();
    const eventScriptureMap = loadEventScripture();
    const all = collectCrossLinksForChapter(book, chapter, { events, profiles, places, eventScriptureMap });
    return {
      placeLinks: all.filter((l) => l.kind === "place"),
      eventLinks: all.filter((l) => l.kind === "timeline_event"),
    };
  }, [events, book, chapter, open]);

  return (
    <Modal open={open} title={`This chapter — ${book} ${chapter}`} onClose={onClose} wide>
      <p className="mb-4 text-sm text-muted-foreground">
        Everything in your library tagged to this passage: people (scripture footprint on their profile), sacred places, and other
        timeline events with scripture links. This list is not filled automatically from the Bible map or place highlights in the text
        — add scripture appearances on people and saved places, and scripture links on timeline events, to see them here.
      </p>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">People</h3>
      {rows.length === 0 ? (
        <p className="mb-6 text-sm text-neutral-600">No people linked to this chapter yet.</p>
      ) : (
        <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
          {rows.map(({ event, profile }) => (
            <li key={event.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
                onClick={() => {
                  onPickPerson(event, profile);
                  onClose();
                }}
              >
                {profile.imageDataUrl ? (
                  <img src={profile.imageDataUrl} alt="" className="h-10 w-10 rounded-full border object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-lg">{event.icon ?? "👤"}</span>
                )}
                <span className="font-medium text-foreground">{profile.name || event.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">Open lore →</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Places</h3>
      {placeLinks.length === 0 ? (
        <p className="mb-6 text-sm text-neutral-600">No places linked to this chapter yet.</p>
      ) : (
        <ul className="mb-6 divide-y divide-border rounded-lg border border-border">
          {placeLinks.map((l) => (
            <li key={l.id}>
              <Link
                to={l.href}
                onClick={onClose}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50"
              >
                <span className="text-lg" aria-hidden>
                  📍
                </span>
                <span className="font-medium text-foreground">{l.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline events</h3>
      {eventLinks.length === 0 ? (
        <p className="text-sm text-neutral-600">No other timeline events linked to this chapter yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {eventLinks.map((l) => (
            <li key={l.id}>
              <Link to={l.href} onClick={onClose} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50">
                <span className="font-medium text-foreground">{l.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
