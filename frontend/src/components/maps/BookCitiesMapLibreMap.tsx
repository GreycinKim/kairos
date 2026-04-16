import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Map as MapLibreMap, Marker, NavigationControl, Source } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Feature, FeatureCollection } from "geojson";
import type { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { createPaulArcLayers } from "@/components/maps/PaulRoutesLayer";
import type { PaulArcDatum, RouteLineFeature } from "@/lib/biblicalRoutesCatalog";
import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";
import {
  BOOK_CITIES_ATTRIBUTION,
  BOOK_CITIES_BASEMAP_DARK,
  BOOK_CITIES_BASEMAP_LIGHT,
} from "@/lib/bookCitiesBasemap";
import { lngLatBoundsLikeFromGeoJson, unionLngLatBounds } from "@/lib/geoJsonBounds";

const SOURCE_PLACES = "kairos-book-places";
const CIRCLE_LAYER_ID = "kairos-book-places-circle";

const SOURCE_OVERLAY = "kairos-historic-overlay";
const OVERLAY_FILL_ID = "kairos-historic-overlay-fill";
const OVERLAY_LINE_IDS = ["kairos-historic-line-a", "kairos-historic-line-b", "kairos-historic-line-c"] as const;

const SOURCE_ROUTE = "kairos-biblical-route";
const ROUTE_HALO_ID = "kairos-route-halo";
const ROUTE_CORE_ID = "kairos-route-core";
const ROUTE_ARROW_IMAGE_ID = "kairos-route-arrow";
const ROUTE_ARROW_LINE_ID = "kairos-route-arrow-symbols";
const SOURCE_ROUTE_ENDPOINTS = "kairos-route-endpoints";
const ROUTE_START_ID = "kairos-route-start";
const ROUTE_END_ID = "kairos-route-end";

const DEFAULT_CENTER: [number, number] = [35.2, 31.85];
const DEFAULT_ZOOM = 6.4;

export type HistoricOverlayRender = {
  geojson: FeatureCollection;
  fillColor: string;
  fillOpacity: number;
  lineColor: string;
  attributionNote?: string;
} | null;

function boundsFromPlaces(places: BibleMapLocationJson[]): LngLatBoundsLike | null {
  if (!places.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const p of places) {
    const { lng, lat } = p;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  if (!Number.isFinite(minLng)) return null;
  const pad = 0.35;
  const dy = maxLat - minLat;
  const dx = maxLng - minLng;
  const extra = dx < 0.02 && dy < 0.02 ? 0.6 : pad;
  return [
    [minLng - extra, minLat - extra],
    [maxLng + extra, maxLat + extra],
  ];
}

/** First / last vertex of each stop-to-stop LineString for start vs end markers. */
function routeEndpointsGeoJson(lines: RouteLineFeature[] | null | undefined): FeatureCollection {
  if (!lines?.length) return { type: "FeatureCollection", features: [] };
  const features: Feature[] = [];
  for (const feat of lines) {
    const coords = feat.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const start = coords[0]!;
    const end = coords[coords.length - 1]!;
    features.push({
      type: "Feature",
      properties: { role: "start" as const },
      geometry: { type: "Point", coordinates: start },
    });
    features.push({
      type: "Feature",
      properties: { role: "end" as const },
      geometry: { type: "Point", coordinates: end },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Raster chevron (points east) for MapLibre symbol along LineString. */
function routeArrowRaster(isDark: boolean): ImageData {
  const w = 56;
  const h = 40;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(w, h);
  const fill = isDark ? "#fb923c" : "#c2410c";
  const stroke = isDark ? "#1c0a02" : "#fff7ed";
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(6, h * 0.5);
  ctx.lineTo(w * 0.58, 7);
  ctx.lineTo(w * 0.58, h - 7);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.25;
  ctx.lineJoin = "round";
  ctx.stroke();
  return ctx.getImageData(0, 0, w, h);
}

function boundsFromPaulArcs(arcs: PaulArcDatum[]): LngLatBoundsLike | null {
  if (!arcs.length) return null;
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: arcs.map((a) => ({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [a.sourcePosition, a.targetPosition],
      },
    })),
  };
  return lngLatBoundsLikeFromGeoJson(fc);
}

function placeTypeIcon(t: string | undefined): string {
  switch (t) {
    case "kairos-place":
      return "📌";
    case "city":
      return "🏛";
    case "mountain":
      return "⛰";
    case "well":
      return "💧";
    case "oasis":
      return "🌿";
    case "island":
      return "⚓";
    case "harbor":
      return "⚓";
    case "wilderness":
      return "🏜";
    case "nation":
      return "🗺";
    case "body-of-water":
      return "🌊";
    case "battle-site":
      return "⚔";
    default:
      return "📍";
  }
}

function placesToGeoJson(places: BibleMapLocationJson[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((loc) => ({
      type: "Feature" as const,
      id: loc.id,
      properties: {
        name: loc.name,
        id: loc.id,
        placeType: loc.type ?? "",
        markerSource: loc.kairosPlaceId ? "kairos" : "catalog",
        kairosPlaceId: loc.kairosPlaceId ?? "",
      },
      geometry: {
        type: "Point" as const,
        coordinates: [loc.lng, loc.lat] as [number, number],
      },
    })),
  };
}

type BookCitiesMapLibreMapProps = {
  places: BibleMapLocationJson[];
  panelTone?: "light" | "dark";
  className?: string;
  /** Legacy stop-only routes as one or more LineStrings (same styling). */
  routeLines: RouteLineFeature[] | null;
  historicOverlay: HistoricOverlayRender;
  /** When set, routes with segments render as deck.gl arcs (multiple journeys supported). */
  paulArcs?: PaulArcDatum[] | null;
};

export function BookCitiesMapLibreMap({
  places,
  panelTone = "light",
  className = "",
  routeLines,
  historicOverlay,
  paulArcs = null,
}: BookCitiesMapLibreMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [arrowImageReady, setArrowImageReady] = useState(false);
  const [openPlaceIds, setOpenPlaceIds] = useState<Set<string>>(new Set());

  const placesById = useMemo(() => {
    const m = new Map<string, BibleMapLocationJson>();
    for (const p of places) m.set(p.id, p);
    return m;
  }, [places]);

  const geojson = useMemo(() => placesToGeoJson(places), [places]);

  const routeFc = useMemo(() => {
    const feats = routeLines?.filter(Boolean) ?? [];
    if (!feats.length) return null;
    return { type: "FeatureCollection" as const, features: feats };
  }, [routeLines]);

  const routeEndpointsFc = useMemo(() => routeEndpointsGeoJson(routeLines ?? null), [routeLines]);

  const paulArcList = useMemo(() => paulArcs ?? [], [paulArcs]);

  const mapStyle = panelTone === "dark" ? BOOK_CITIES_BASEMAP_DARK : BOOK_CITIES_BASEMAP_LIGHT;

  const combinedBounds = useMemo(() => {
    const lineBounds = routeFc ? lngLatBoundsLikeFromGeoJson(routeFc) : null;
    const parts: (LngLatBoundsLike | null)[] = [
      boundsFromPlaces(places),
      lineBounds,
      historicOverlay ? lngLatBoundsLikeFromGeoJson(historicOverlay.geojson) : null,
      boundsFromPaulArcs(paulArcList),
    ];
    return unionLngLatBounds(...parts);
  }, [places, routeFc, historicOverlay, paulArcList]);

  const fitToContent = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.isStyleLoaded()) return;
    const b = combinedBounds;
    if (b) {
      map.fitBounds(b, { padding: 52, maxZoom: 10.8, duration: 550 });
    } else {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 450 });
    }
  }, [combinedBounds]);

  const onMapLoad = useCallback(() => {
    setMapReady(true);
    requestAnimationFrame(() => fitToContent());
  }, [fitToContent]);

  useEffect(() => {
    if (!mapReady) {
      setArrowImageReady(false);
      return undefined;
    }
    const map = mapRef.current?.getMap();
    if (!map) return undefined;

    let cancelled = false;
    const installArrow = () => {
      if (!map.isStyleLoaded() || cancelled) return;
      try {
        const raster = routeArrowRaster(panelTone === "dark");
        if (map.hasImage(ROUTE_ARROW_IMAGE_ID)) map.removeImage(ROUTE_ARROW_IMAGE_ID);
        map.addImage(ROUTE_ARROW_IMAGE_ID, raster, { pixelRatio: 2 });
        if (!cancelled) setArrowImageReady(true);
      } catch {
        if (!cancelled) setArrowImageReady(false);
      }
    };

    if (map.isStyleLoaded()) installArrow();
    else map.once("idle", installArrow);

    return () => {
      cancelled = true;
      map.off("idle", installArrow);
      try {
        if (map.hasImage(ROUTE_ARROW_IMAGE_ID)) map.removeImage(ROUTE_ARROW_IMAGE_ID);
      } catch {
        /* ignore */
      }
      setArrowImageReady(false);
    };
  }, [mapReady, panelTone]);

  useEffect(() => {
    if (!mapReady) return;
    fitToContent();
  }, [mapReady, fitToContent, geojson, routeFc, historicOverlay?.geojson, paulArcList, routeLines]);

  useEffect(() => {
    if (!mapReady) return undefined;
    const map = mapRef.current?.getMap();
    if (!map) return undefined;
    const overlay = new MapboxOverlay({ interleaved: true, layers: createPaulArcLayers(paulArcList) });
    map.addControl(overlay);
    return () => {
      map.removeControl(overlay);
      overlay.finalize();
    };
  }, [mapReady, paulArcList]);

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || f.geometry?.type !== "Point") {
        return;
      }
      const id = String((f.properties as { id?: string }).id ?? "");
      const pl = placesById.get(id);
      if (!pl) {
        return;
      }
      setOpenPlaceIds((prev) => {
        const next = new Set(prev);
        if (next.has(pl.id)) next.delete(pl.id);
        else next.add(pl.id);
        return next;
      });
    },
    [placesById],
  );

  const navStyle =
    panelTone === "dark"
      ? { backgroundColor: "rgba(20,28,46,0.92)", color: "#e5e5e5" }
      : { backgroundColor: "rgba(255,255,255,0.95)", color: "#262626" };

  const routeColor = panelTone === "dark" ? "#fb923c" : "#c2410c";
  const routeHaloColor = panelTone === "dark" ? "#fdba74" : "#ea580c";

  const footerExtra = historicOverlay?.attributionNote ? ` · ${historicOverlay.attributionNote}` : "";

  const glowSpecs: { width: number; opacity: number; blur: number }[] = [
    { width: 22, opacity: 0.12, blur: 12 },
    { width: 12, opacity: 0.16, blur: 6 },
    { width: 5, opacity: 0.22, blur: 2.5 },
  ];

  return (
    <div className={`relative min-h-0 min-w-0 flex-1 ${className}`}>
      <MapLibreMap
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onLoad={onMapLoad}
        onClick={onClick}
        interactiveLayerIds={[CIRCLE_LAYER_ID]}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} style={navStyle} />

        {historicOverlay ? (
          <Source id={SOURCE_OVERLAY} type="geojson" data={historicOverlay.geojson}>
            <Layer
              id={OVERLAY_FILL_ID}
              type="fill"
              paint={{
                "fill-color": historicOverlay.fillColor,
                "fill-opacity": historicOverlay.fillOpacity,
                "fill-outline-color": "rgba(0,0,0,0)",
              }}
            />
            {OVERLAY_LINE_IDS.map((lid, i) => {
              const g = glowSpecs[i]!;
              return (
                <Layer
                  key={lid}
                  id={lid}
                  type="line"
                  paint={{
                    "line-color": historicOverlay.lineColor,
                    "line-opacity": g.opacity,
                    "line-width": g.width,
                    "line-blur": g.blur,
                  }}
                />
              );
            })}
          </Source>
        ) : null}

        {routeFc ? (
          <Source id={SOURCE_ROUTE} type="geojson" data={routeFc}>
            <Layer
              id={ROUTE_HALO_ID}
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": routeHaloColor,
                "line-width": 18,
                "line-opacity": 0.2,
                "line-blur": 8,
              }}
            />
            <Layer
              id={ROUTE_CORE_ID}
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": routeColor,
                "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2.2, 12, 4.2],
                "line-opacity": 0.92,
              }}
            />
            {arrowImageReady ? (
              <Layer
                id={ROUTE_ARROW_LINE_ID}
                type="symbol"
                layout={{
                  "symbol-placement": "line",
                  "symbol-spacing": 68,
                  "icon-image": ROUTE_ARROW_IMAGE_ID,
                  "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.32, 10, 0.42, 14, 0.5],
                  "icon-allow-overlap": true,
                  "icon-ignore-placement": true,
                  "icon-padding": 0,
                  "icon-rotation-alignment": "map",
                  "icon-pitch-alignment": "map",
                }}
                paint={{
                  "icon-opacity": 0.95,
                }}
                minzoom={4}
              />
            ) : null}
          </Source>
        ) : null}

        {routeEndpointsFc.features.length ? (
          <Source id={SOURCE_ROUTE_ENDPOINTS} type="geojson" data={routeEndpointsFc}>
            <Layer
              id={ROUTE_START_ID}
              type="circle"
              filter={["==", ["get", "role"], "start"]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 11, 7],
                "circle-color": panelTone === "dark" ? "rgba(74,222,128,0.22)" : "rgba(22,163,74,0.2)",
                "circle-stroke-width": 2.25,
                "circle-stroke-color": panelTone === "dark" ? "#4ade80" : "#15803d",
                "circle-opacity": 0.95,
              }}
            />
            <Layer
              id={ROUTE_END_ID}
              type="circle"
              filter={["==", ["get", "role"], "end"]}
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4.5, 11, 8],
                "circle-color": panelTone === "dark" ? "#f97316" : "#9a3412",
                "circle-stroke-width": 2,
                "circle-stroke-color": panelTone === "dark" ? "#fff7ed" : "#ffedd5",
                "circle-opacity": 0.95,
              }}
            />
          </Source>
        ) : null}

        <Source id={SOURCE_PLACES} type="geojson" data={geojson} promoteId="id">
          <Layer
            id={CIRCLE_LAYER_ID}
            type="circle"
            paint={{
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 3.2, 7, 5.5, 11, 9],
              "circle-color": [
                "case",
                ["==", ["get", "markerSource"], "kairos"],
                panelTone === "dark" ? "#2dd4bf" : "#0d9488",
                panelTone === "dark" ? "#f59e0b" : "#b45309",
              ],
              "circle-opacity": 0.88,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>

        {places
          .filter((p) => openPlaceIds.has(p.id))
          .map((p) => (
            <Marker key={`open-label-${p.id}`} longitude={p.lng} latitude={p.lat} anchor="top" offset={[0, -8]}>
              <div className="rounded-md border border-neutral-200 bg-white/95 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-sm">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenPlaceIds((prev) => {
                      const next = new Set(prev);
                      next.delete(p.id);
                      return next;
                    });
                  }}
                >
                  <span className="mr-1">{placeTypeIcon(p.type)}</span>
                  {p.name}
                </button>
                {p.kairosPlaceId ? (
                  <a
                    href={`/places/${p.kairosPlaceId}`}
                    className="mt-1 block text-[10px] font-medium text-teal-700 underline hover:text-teal-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open in Places
                  </a>
                ) : null}
              </div>
            </Marker>
          ))}
      </MapLibreMap>

      {paulArcList.length || routeFc ? (
        <div
          className={`pointer-events-none absolute bottom-10 left-2 z-20 max-w-[15rem] rounded-md border px-2 py-1.5 text-[10px] shadow-sm ${
            panelTone === "dark"
              ? "border-white/15 bg-[#141c2e]/95 text-neutral-200"
              : "border-neutral-200 bg-white/95 text-neutral-700"
          }`}
        >
          <p className="font-semibold">Journeys</p>
          {paulArcList.length ? (
            <>
              <p className="mt-0.5 flex items-center gap-1">
                <span className="inline-block h-2 w-4 rounded-sm bg-blue-500/80" aria-hidden />
                Blue arc = sea
              </p>
              <p className="mt-0.5 flex items-center gap-1">
                <span className="inline-block h-2 w-4 rounded-sm bg-orange-600/80" aria-hidden />
                Orange arc = land
              </p>
              <p className="mt-0.5 text-neutral-500">▸ at each leg points toward that leg&apos;s end</p>
            </>
          ) : null}
          {routeFc ? (
            <p className="mt-0.5 text-neutral-500">
              Stop-to-stop path: chevrons = direction · green ring = start · dark orange = end
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className={`pointer-events-none absolute bottom-1 left-1 right-16 z-10 max-h-12 overflow-hidden text-[9px] leading-tight opacity-80 ${
          panelTone === "dark" ? "text-neutral-300" : "text-neutral-600"
        }`}
      >
        {BOOK_CITIES_ATTRIBUTION}
        {footerExtra}
      </div>
    </div>
  );
}
