/**
 * Optional historical / tribal **polygon** overlays (Roman, Persian, twelve tribes, etc.).
 *
 * Add entries to `public/bible-map/data/historical-overlays.json` and place GeoJSON files
 * under `public/bible-map/data/overlays/`. Convert AWMC shapefiles (or other sources you
 * are licensed to use) to GeoJSON — MultiPolygon or Polygon features work best.
 *
 * Styling (soft fill + blurred boundary rings) is applied in {@link BookCitiesMapLibreMap}.
 */
import type { FeatureCollection } from "geojson";

import { publicAssetUrl } from "@/lib/publicAssetUrl";

export type HistoricalOverlayManifestEntry = {
  id: string;
  label: string;
  /** Path relative to site root, e.g. `bible-map/data/overlays/roman-ad117.geojson` */
  geojsonUrl: string;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  /** Extra attribution for this layer (shown in the map footer when active). */
  attributionNote?: string;
};

export type HistoricalOverlaysFile = {
  overlays: HistoricalOverlayManifestEntry[];
};

let manifestCache: HistoricalOverlaysFile | null = null;

export async function loadHistoricalOverlaysManifest(): Promise<HistoricalOverlaysFile> {
  if (manifestCache) return manifestCache;
  const url = publicAssetUrl("bible-map/data/historical-overlays.json");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as HistoricalOverlaysFile;
  manifestCache = { overlays: Array.isArray(data.overlays) ? data.overlays : [] };
  return manifestCache;
}

export async function fetchOverlayGeoJson(entry: HistoricalOverlayManifestEntry): Promise<FeatureCollection> {
  const url = publicAssetUrl(entry.geojsonUrl.replace(/^\//, ""));
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as FeatureCollection;
  if (!data || data.type !== "FeatureCollection") {
    throw new Error("GeoJSON must be a FeatureCollection");
  }
  return data;
}
