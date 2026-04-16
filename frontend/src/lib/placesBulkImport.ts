import type { AtlasMapPin } from "@/lib/mapAtlasTypes";
import type { ScriptureAppearance } from "@/lib/timelinePeople";

import { loadPlaces, newPlaceId, savePlaces, type PlaceRecord } from "@/lib/places";

export type PlacePackPlace = {
  /** If set, this id is used (upsert: replaces existing row with the same id). */
  id?: string;
  name: string;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
  atlasPin?: AtlasMapPin | null;
  description?: string | null;
  imageDataUrl?: string | null;
  scriptureAppearances?: ScriptureAppearance[];
  relatedTimelineEventIds?: string[];
};

export type PlacePackRow = {
  slug: string;
  place: PlacePackPlace;
};

export type PlacesPackJson = {
  source?: string;
  places: PlacePackRow[];
};

export type PlaceImportOk = { slug: string; placeId: string; name: string };
export type PlaceImportFail = { slug: string; error: string };

function nameTakenElsewhere(places: Record<string, PlaceRecord>, nameLower: string, exceptId: string): boolean {
  for (const [pid, rec] of Object.entries(places)) {
    if (pid === exceptId) continue;
    if (rec.name.trim().toLowerCase() === nameLower) return true;
  }
  return false;
}

/**
 * Merges place rows into localStorage (`kairos-places-v1`).
 * Timeline events are not created — `relatedTimelineEventIds` must match existing event ids if used.
 */
export function importPlacesFromPack(
  pack: PlacesPackJson,
  existingNamesLower: Set<string>,
  options?: { skipDuplicateNames?: boolean },
): { created: PlaceImportOk[]; failed: PlaceImportFail[] } {
  const created: PlaceImportOk[] = [];
  const failed: PlaceImportFail[] = [];
  const next: Record<string, PlaceRecord> = { ...loadPlaces() };

  for (const row of pack.places) {
    const slug = row.slug?.trim() || "(no slug)";
    const raw = row.place;
    const name = raw?.name?.trim();
    if (!name) {
      failed.push({ slug, error: "Missing place.name" });
      continue;
    }
    const nameLower = name.toLowerCase();

    const upsertId = raw.id?.trim();
    let id = upsertId || newPlaceId();
    if (!upsertId) {
      while (next[id]) id = newPlaceId();
    }

    if (options?.skipDuplicateNames) {
      if (nameTakenElsewhere(next, nameLower, id)) {
        failed.push({ slug, error: `Duplicate name: ${name}` });
        continue;
      }
      if (!upsertId && existingNamesLower.has(nameLower)) {
        failed.push({ slug, error: `Duplicate name: ${name}` });
        continue;
      }
    }

    const pin = raw.atlasPin;
    const atlasPin =
      pin &&
      typeof pin.catalogMapId === "string" &&
      pin.catalogMapId.trim() &&
      typeof pin.nx === "number" &&
      typeof pin.ny === "number"
        ? {
            catalogMapId: pin.catalogMapId.trim(),
            nx: pin.nx,
            ny: pin.ny,
          }
        : undefined;

    const lat = raw.lat;
    const lng = raw.lng;
    const geo =
      typeof lat === "number" &&
      Number.isFinite(lat) &&
      typeof lng === "number" &&
      Number.isFinite(lng)
        ? { lat, lng }
        : {};

    const record: PlaceRecord = {
      id,
      name,
      region: raw.region?.trim() || undefined,
      ...geo,
      atlasPin,
      description: raw.description?.trim() || undefined,
      imageDataUrl: raw.imageDataUrl ?? undefined,
      scriptureAppearances: raw.scriptureAppearances?.length ? raw.scriptureAppearances : undefined,
      relatedTimelineEventIds: raw.relatedTimelineEventIds?.length ? raw.relatedTimelineEventIds : undefined,
    };
    next[id] = record;
    existingNamesLower.add(nameLower);
    created.push({ slug, placeId: id, name });
  }

  savePlaces(next);
  return { created, failed };
}

export function parsePlacesPackJson(raw: string): PlacesPackJson {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("Top level must be an object");
  const p = parsed as { places?: unknown };
  if (!Array.isArray(p.places)) throw new Error('Expected a "places" array');
  return parsed as PlacesPackJson;
}
