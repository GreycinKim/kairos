import type { PlaceRecord } from "@/lib/places";
import { getScripturesForTimelineEvent, type EventScriptureMap } from "@/lib/eventScripture";
import { profileAppearsInChapter, type PersonProfile, type ScriptureAppearance } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";

export type ScriptureCrossLinkKind = "person" | "place" | "timeline_event";

export type ScriptureCrossLink = {
  kind: ScriptureCrossLinkKind;
  id: string;
  label: string;
  href: string;
  chapterLabel: string;
};

export function formatChapterLabel(book: string, chapter: number): string {
  return `${book} ${chapter}`;
}

export type ScriptureConnectionContext = {
  events: TimelineEvent[];
  profiles: Record<string, PersonProfile>;
  eventScriptureMap: EventScriptureMap;
  places: Record<string, PlaceRecord>;
  excludeEventId?: string;
  excludePlaceId?: string;
};

/**
 * People, places, and non-person timeline events that share this book + chapter.
 */
export function collectCrossLinksForChapter(book: string, chapter: number, ctx: ScriptureConnectionContext): ScriptureCrossLink[] {
  const out: ScriptureCrossLink[] = [];
  const chapterLabel = formatChapterLabel(book, chapter);

  for (const ev of ctx.events) {
    if (ev.id === ctx.excludeEventId) continue;
    if (ev.type !== "person" && ev.type !== "ruler") continue;
    const profile =
      ctx.profiles[ev.id] ??
      ({
        eventId: ev.id,
        name: ev.title,
        scope: "bible" as const,
      } satisfies PersonProfile);
    if (profileAppearsInChapter(profile, book, chapter)) {
      out.push({
        kind: "person",
        id: ev.id,
        label: profile.name || ev.title,
        href: `/timeline/person/${ev.id}`,
        chapterLabel,
      });
    }
  }

  for (const place of Object.values(ctx.places)) {
    if (place.id === ctx.excludePlaceId) continue;
    const rows = place.scriptureAppearances ?? [];
    if (!rows.some((r) => r.book === book && r.chapter === chapter)) continue;
    out.push({
      kind: "place",
      id: place.id,
      label: place.name,
      href: `/places/${place.id}`,
      chapterLabel,
    });
  }

  for (const ev of ctx.events) {
    if (ev.id === ctx.excludeEventId) continue;
    if (ev.type === "person" || ev.type === "ruler") continue;
    const profile = ctx.profiles[ev.id];
    const rows = getScripturesForTimelineEvent(ev, profile, ctx.eventScriptureMap);
    if (!rows.some((r) => r.book === book && r.chapter === chapter)) continue;
    out.push({
      kind: "timeline_event",
      id: ev.id,
      label: ev.title,
      href: `/timeline/event/${ev.id}`,
      chapterLabel,
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export function collectCrossLinksForPassages(
  passages: ScriptureAppearance[],
  ctx: ScriptureConnectionContext,
): ScriptureCrossLink[] {
  const seen = new Set<string>();
  const out: ScriptureCrossLink[] = [];
  for (const p of passages) {
    const rows = collectCrossLinksForChapter(p.book, p.chapter, ctx);
    for (const r of rows) {
      const k = `${r.kind}:${r.id}:${r.chapterLabel}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
  }
  out.sort((a, b) => a.chapterLabel.localeCompare(b.chapterLabel) || a.label.localeCompare(b.label));
  return out;
}
