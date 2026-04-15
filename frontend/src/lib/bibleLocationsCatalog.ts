import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";
import { publicAssetUrl } from "@/lib/publicAssetUrl";

let locationsCache: BibleMapLocationJson[] | null = null;

/** Shared catalog for reader place links and map lookups (includes `description` when present in JSON). */
export async function loadBibleLocationsCatalog(): Promise<BibleMapLocationJson[]> {
  if (locationsCache) return locationsCache;
  const url = publicAssetUrl("bible-map/data/locations.json");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as BibleMapLocationJson[];
  locationsCache = Array.isArray(data) ? data : [];
  return locationsCache;
}

export function locationByIdFromList(list: BibleMapLocationJson[], id: string): BibleMapLocationJson | undefined {
  return list.find((p) => p.id === id);
}
