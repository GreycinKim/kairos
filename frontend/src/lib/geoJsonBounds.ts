import type { LngLatBoundsLike } from "maplibre-gl";

/** Walk GeoJSON-like nested arrays and collect [lng, lat] pairs (ignores altitude). */
function collectLngLatPairs(node: unknown, out: [number, number][]): void {
  if (!Array.isArray(node)) return;
  const a = node[0];
  const b = node[1];
  if (typeof a === "number" && typeof b === "number") {
    out.push([a, b]);
    return;
  }
  for (const x of node) collectLngLatPairs(x, out);
}

/** Bounding box for fitBounds from any GeoJSON object. */
export function lngLatBoundsLikeFromGeoJson(data: unknown): LngLatBoundsLike | null {
  const pairs: [number, number][] = [];
  collectLngLatPairs(data, pairs);
  if (!pairs.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of pairs) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  if (!Number.isFinite(minLng)) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/** Merge several bounds (southwest–northeast corner pairs). */
export function unionLngLatBounds(
  ...bounds: (LngLatBoundsLike | null | undefined)[]
): LngLatBoundsLike | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let any = false;
  for (const b of bounds) {
    if (!b) continue;
    const pair = b as [[number, number], [number, number]];
    const [x1, y1] = pair[0];
    const [x2, y2] = pair[1];
    const w = Math.min(x1, x2);
    const e = Math.max(x1, x2);
    const s = Math.min(y1, y2);
    const n = Math.max(y1, y2);
    minLng = Math.min(minLng, w);
    minLat = Math.min(minLat, s);
    maxLng = Math.max(maxLng, e);
    maxLat = Math.max(maxLat, n);
    any = true;
  }
  if (!any) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
