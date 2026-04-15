import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";
import { publicAssetUrl } from "@/lib/publicAssetUrl";

export type RouteTransportMode = "land" | "sea" | "mixed";

export type BiblicalRouteSegment = {
  from: string;
  to: string;
  mode: "land" | "sea";
  /** Optional verse citation for this hop (display / tooling). */
  ref?: string;
};

export type BiblicalRouteDef = {
  id: string;
  label: string;
  /** Ordered stops (legacy LineString); derived from `segments` when omitted at load time. */
  stopPlaceIds?: string[];
  category?: string;
  transportMode?: RouteTransportMode;
  /** Optional metadata (catalog / UI). */
  person?: string;
  description?: string;
  /** Aligns with `locations.json` era tags and map era filter. */
  era?: string;
  bibleRef?: string;
  /** Segment list for deck.gl arcs (sea vs land styling). */
  segments?: BiblicalRouteSegment[];
};

export type BiblicalRoutesFile = {
  /** Human notes (e.g. missing Acts places to add to locations.json). */
  dataNotes?: string[];
  routes: BiblicalRouteDef[];
};

let cache: BiblicalRoutesFile | null = null;

/** Ordered stops along segment chain (handles forks by revisiting `from` when it differs from the last stop). */
export function stopPlaceIdsFromSegments(segments: BiblicalRouteSegment[] | undefined): string[] {
  if (!segments?.length) return [];
  const stops: string[] = [];
  for (const seg of segments) {
    const last = stops[stops.length - 1];
    if (stops.length === 0 || last !== seg.from) {
      stops.push(seg.from);
    }
    stops.push(seg.to);
  }
  const deduped: string[] = [];
  for (const id of stops) {
    if (deduped.length && deduped[deduped.length - 1] === id) continue;
    deduped.push(id);
  }
  return deduped;
}

export function normalizeBiblicalRoute(route: BiblicalRouteDef): BiblicalRouteDef {
  const segments = route.segments?.length ? route.segments : undefined;
  const derived = segments ? stopPlaceIdsFromSegments(segments) : [];
  const stopPlaceIds =
    route.stopPlaceIds && route.stopPlaceIds.length > 0 ? route.stopPlaceIds : derived.length > 0 ? derived : [];
  return { ...route, stopPlaceIds, segments };
}

export async function loadBiblicalRoutesCatalog(): Promise<BiblicalRoutesFile> {
  if (cache) return cache;
  const url = publicAssetUrl("bible-map/data/biblical-routes.json");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as BiblicalRoutesFile;
  const raw = Array.isArray(data.routes) ? data.routes : [];
  cache = {
    dataNotes: Array.isArray(data.dataNotes) ? data.dataNotes : undefined,
    routes: raw.map((r) => normalizeBiblicalRoute(r as BiblicalRouteDef)),
  };
  return cache;
}

export type RouteLineFeature = {
  type: "Feature";
  properties: { kind: "biblical-route" };
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

/** Build a single LineString feature from ordered place ids; skips unknown ids and dedupes consecutive coordinates. */
export function lineStringFeatureFromStops(
  stopPlaceIds: string[] | undefined,
  byId: Map<string, Pick<BibleMapLocationJson, "lng" | "lat" | "name" | "id">>,
): RouteLineFeature | null {
  if (!stopPlaceIds?.length) return null;
  const coords: [number, number][] = [];
  for (const id of stopPlaceIds) {
    const p = byId.get(id);
    if (!p || !Number.isFinite(p.lng) || !Number.isFinite(p.lat)) continue;
    const last = coords[coords.length - 1];
    if (last && last[0] === p.lng && last[1] === p.lat) continue;
    coords.push([p.lng, p.lat]);
  }
  if (coords.length < 2) return null;
  return {
    type: "Feature",
    properties: { kind: "biblical-route" },
    geometry: {
      type: "LineString",
      coordinates: coords,
    },
  };
}

export function locationIndexById(locations: BibleMapLocationJson[]): Map<string, BibleMapLocationJson> {
  const m = new Map<string, BibleMapLocationJson>();
  for (const loc of locations) m.set(loc.id, loc);
  return m;
}

export function routeIsPaulCategory(route: BiblicalRouteDef): boolean {
  return route.category === "paul" || route.label.toLowerCase().includes("paul");
}

export function routeHasDeckSegments(route: BiblicalRouteDef): boolean {
  return Boolean(route.segments?.length);
}

export type PaulArcDatum = {
  id: string;
  routeId: string;
  mode: "land" | "sea";
  sourcePosition: [number, number];
  targetPosition: [number, number];
};

/** Arc rows for {@link createPaulArcLayers}; skips segments with unknown place ids. */
export function buildRouteArcData(
  routes: BiblicalRouteDef[],
  byId: Map<string, Pick<BibleMapLocationJson, "lng" | "lat" | "id">>,
  visibleRouteIds: string[] | null,
): PaulArcDatum[] {
  const allow = visibleRouteIds?.length ? new Set(visibleRouteIds) : null;
  const out: PaulArcDatum[] = [];
  let arcSeq = 0;
  for (const route of routes) {
    if (!routeHasDeckSegments(route)) continue;
    if (allow && !allow.has(route.id)) continue;
    const segs = route.segments ?? [];
    for (const seg of segs) {
      const a = byId.get(seg.from);
      const b = byId.get(seg.to);
      if (!a || !b || !Number.isFinite(a.lng) || !Number.isFinite(a.lat) || !Number.isFinite(b.lng) || !Number.isFinite(b.lat)) {
        continue;
      }
      if (a.lng === b.lng && a.lat === b.lat) continue;
      arcSeq += 1;
      out.push({
        id: `${route.id}-${arcSeq}`,
        routeId: route.id,
        mode: seg.mode,
        sourcePosition: [a.lng, a.lat],
        targetPosition: [b.lng, b.lat],
      });
    }
  }
  return out;
}

/** @deprecated Use {@link buildRouteArcData} (same behavior; name kept for callers that still import it). */
export const buildPaulArcData = buildRouteArcData;
