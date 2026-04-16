import { api } from "@/api/client";
import type { AtlasMapPin } from "@/lib/mapAtlasTypes";
import type { ScriptureAppearance } from "@/lib/timelinePeople";
import { bumpWorkspaceEpoch } from "@/lib/workspaceRemoteSync";

export type PlaceRecord = {
  id: string;
  name: string;
  /** Optional area label (e.g. Judea, Galilee) for grouping and filters on the Places page. */
  region?: string;
  /** Optional WGS84 coordinates for the Book cities (MapLibre) map — shown on every chapter once set. */
  lat?: number;
  lng?: number;
  /** Optional pin on a workspace atlas plate (same plate as reader sidebar for that era). */
  atlasPin?: AtlasMapPin;
  description?: string;
  imageDataUrl?: string | null;
  /** Scripture scenes set at this place (book + chapter). */
  scriptureAppearances?: ScriptureAppearance[];
  /** Curated timeline events tied to this location (any type). */
  relatedTimelineEventIds?: string[];
};

export const PLACES_STORAGE_KEY = "kairos-places-v1";
const LS_KEY = PLACES_STORAGE_KEY;

let placesSaveTimer: ReturnType<typeof setTimeout> | null = null;
let placesSyncReady = false;

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
    return;
  }
  if (placesSaveTimer) clearTimeout(placesSaveTimer);
  placesSaveTimer = setTimeout(() => {
    placesSaveTimer = null;
    if (!placesSyncReady) return;
    const latest = loadPlaces();
    void api.put("/library/place-records", { places: latest }).catch(() => {
      /* offline */
    });
  }, 900);
}

export function flushPlacesSaveNow(): void {
  if (placesSaveTimer) {
    clearTimeout(placesSaveTimer);
    placesSaveTimer = null;
  }
  if (!placesSyncReady) return;
  const data = loadPlaces();
  void api.put("/library/place-records", { places: data }).catch(() => {
    /* offline */
  });
}

export async function hydratePlacesFromServer(): Promise<void> {
  try {
    const { data } = await api.get<{ places: Record<string, PlaceRecord> }>("/library/place-records");
    const remote = data?.places ?? {};
    if (Object.keys(remote).length > 0) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(remote));
      bumpWorkspaceEpoch();
      return;
    }
    const local = loadPlaces();
    if (Object.keys(local).length > 0) {
      await api.put("/library/place-records", { places: local });
      bumpWorkspaceEpoch();
    }
  } catch {
    /* offline */
  } finally {
    placesSyncReady = true;
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
