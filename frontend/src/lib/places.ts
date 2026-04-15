import type { AtlasMapPin } from "@/lib/mapAtlasTypes";
import type { ScriptureAppearance } from "@/lib/timelinePeople";

export type PlaceRecord = {
  id: string;
  name: string;
  /** Optional area label (e.g. Judea, Galilee) for grouping and filters on the Places page. */
  region?: string;
  /** Optional pin on a workspace atlas plate (same plate as reader sidebar for that era). */
  atlasPin?: AtlasMapPin;
  description?: string;
  imageDataUrl?: string | null;
  /** Scripture scenes set at this place (book + chapter). */
  scriptureAppearances?: ScriptureAppearance[];
  /** Curated timeline events tied to this location (any type). */
  relatedTimelineEventIds?: string[];
};

const LS_KEY = "kairos-places-v1";

export function loadPlaces(): Record<string, PlaceRecord> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PlaceRecord>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePlaces(data: Record<string, PlaceRecord>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function newPlaceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function placeScriptureMentionsBook(p: PlaceRecord, book: string): boolean {
  return (p.scriptureAppearances ?? []).some((r) => r.book === book);
}

export function placeScriptureMentionsChapter(p: PlaceRecord, book: string, chapter: number): boolean {
  return (p.scriptureAppearances ?? []).some((r) => r.book === book && r.chapter === chapter);
}
