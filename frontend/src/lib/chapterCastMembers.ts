import type { TimelineEvent } from "@/types";

import {
  figureKindSortIndex,
  profileAppearsInChapter,
  type PersonProfile,
} from "@/lib/timelinePeople";

/**
 * People/rulers tagged as appearing in this chapter (scripture footprint), sorted by figure kind then name.
 */
export function listProfilesInChapter(
  events: TimelineEvent[],
  profiles: Record<string, PersonProfile>,
  book: string,
  chapter: number,
): { event: TimelineEvent; profile: PersonProfile }[] {
  const out: { event: TimelineEvent; profile: PersonProfile }[] = [];
  for (const ev of events) {
    if (ev.type !== "person" && ev.type !== "ruler") continue;
    const profile =
      profiles[ev.id] ??
      ({
        eventId: ev.id,
        name: ev.title,
        scope: "bible" as const,
      } satisfies PersonProfile);
    if (profileAppearsInChapter(profile, book, chapter)) {
      out.push({ event: ev, profile });
    }
  }
  out.sort((a, b) => {
    const da = figureKindSortIndex(a.profile.figureKind);
    const db = figureKindSortIndex(b.profile.figureKind);
    if (da !== db) return da - db;
    return (a.profile.name || a.event.title || "").localeCompare(b.profile.name || b.event.title || "");
  });
  return out;
}
