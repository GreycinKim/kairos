import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import type { PlaceRecord } from "@/lib/places";

/** Minimal shape from `public/bible-map/data/locations.json`. */
export type BibleMapLocationJson = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  type?: string;
  /** Tags such as `patriarchs`, `exodus-conquest`, `jesus-ministry` (see `locations.json`). */
  era?: string[];
  scripture?: { ref: string; text?: string }[];
  /** When set, marker comes from the Places library; links to `/places/{id}`. */
  kairosPlaceId?: string;
};

const BOOKS_LONGEST_FIRST = [...ALL_BIBLE_BOOKS].sort((a, b) => b.length - a.length);

/** Which biblical book a verse reference starts with (WEB-style names). */
export function bookFromScriptureRef(ref: string): string | null {
  const r = ref.trim();
  for (const b of BOOKS_LONGEST_FIRST) {
    if (r.startsWith(`${b} `) || r.startsWith(`${b}\u00a0`)) return b;
  }
  return null;
}

export function locationMentionsBook(loc: BibleMapLocationJson, book: string): boolean {
  const rows = loc.scripture ?? [];
  if (!rows.length) return false;
  for (const row of rows) {
    if (bookFromScriptureRef(row.ref) === book) return true;
  }
  return false;
}

/** Eastern Mediterranean / Levant bounding box → 0–1 on the overview plate (approximate). */
/** MapLibre markers for user places that have `lat`/`lng` (always shown, regardless of chapter filters). */
export function bibleMapLocationsFromUserPlaces(places: Record<string, PlaceRecord>): BibleMapLocationJson[] {
  const out: BibleMapLocationJson[] = [];
  for (const p of Object.values(places)) {
    const lat = p.lat;
    const lng = p.lng;
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: `kairos-place-${p.id}`,
      name: p.name,
      lat,
      lng,
      type: "kairos-place",
      description: p.description,
      kairosPlaceId: p.id,
    });
  }
  return out;
}

export function latLngToOverviewMap(lng: number, lat: number): { nx: number; ny: number } {
  const LNG0 = 14;
  const LNG1 = 52;
  const LAT0 = 24;
  const LAT1 = 43;
  const nx = (lng - LNG0) / (LNG1 - LNG0);
  const ny = 1 - (lat - LAT0) / (LAT1 - LAT0);
  return {
    nx: Math.min(1, Math.max(0, nx)),
    ny: Math.min(1, Math.max(0, ny)),
  };
}
