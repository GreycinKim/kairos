import type { ChapterAtlasState } from "@/lib/chapterAtlasState";
import type { PlaceRecord } from "@/lib/places";
import type { PersonProfile } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { notifyWorkspaceLocalChanged } from "@/lib/workspaceRemotePushSchedule";

export type AtlasRoutePoint = { nx: number; ny: number };

/** User-drawn path on a specific atlas plate (e.g. travel between two sites). */
export type AtlasRoute = {
  id: string;
  catalogMapId: string;
  label?: string;
  points: AtlasRoutePoint[];
};

export const ATLAS_ROUTES_STORAGE_KEY = "kairos-atlas-routes-v1";
const ROUTES_LS = ATLAS_ROUTES_STORAGE_KEY;

export function clampAtlasCoord(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function loadAtlasRoutes(): AtlasRoute[] {
  try {
    const raw = window.localStorage.getItem(ROUTES_LS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is AtlasRoute =>
        r &&
        typeof r === "object" &&
        typeof (r as AtlasRoute).id === "string" &&
        typeof (r as AtlasRoute).catalogMapId === "string" &&
        Array.isArray((r as AtlasRoute).points),
    );
  } catch {
    return [];
  }
}

export function saveAtlasRoutes(routes: AtlasRoute[]) {
  try {
    window.localStorage.setItem(ROUTES_LS, JSON.stringify(routes));
    notifyWorkspaceLocalChanged();
  } catch {
    /* ignore */
  }
}

export function routesForCatalogMapId(routes: AtlasRoute[], catalogMapId: string): AtlasRoute[] {
  return routes.filter((r) => r.catalogMapId === catalogMapId && r.points.length >= 2);
}

export function addAtlasRoute(route: AtlasRoute): AtlasRoute[] {
  const all = loadAtlasRoutes();
  const next = [...all.filter((r) => r.id !== route.id), route];
  saveAtlasRoutes(next);
  return next;
}

export function removeAtlasRoute(routeId: string): AtlasRoute[] {
  const next = loadAtlasRoutes().filter((r) => r.id !== routeId);
  saveAtlasRoutes(next);
  return next;
}

export type AtlasMapMarkerView = {
  nx: number;
  ny: number;
  label: string;
  href?: string;
  imageSrc?: string | null;
  fallbackEmoji?: string;
  /** When set, the reader map can treat this marker as a draggable person pin. */
  kind?: "place" | "person";
  /** Place id or timeline person event id (matches `kind`). */
  entityId?: string;
  /** Locked position (no drag) until unpinned in the sidebar. */
  pinned?: boolean;
};

/** Markers for one passage from per-chapter atlas state (positions + pin flags). */
export function markersFromChapterState(
  state: ChapterAtlasState,
  ctx: {
    events: TimelineEvent[];
    profiles: Record<string, PersonProfile>;
    places: Record<string, PlaceRecord>;
  },
): AtlasMapMarkerView[] {
  const markers: AtlasMapMarkerView[] = [];
  for (const [placeId, pin] of Object.entries(state.places)) {
    const p = ctx.places[placeId];
    if (!p) continue;
    markers.push({
      nx: clampAtlasCoord(pin.nx),
      ny: clampAtlasCoord(pin.ny),
      label: p.name,
      href: `/places/${placeId}`,
      imageSrc: p.imageDataUrl ?? null,
      fallbackEmoji: "📍",
      kind: "place",
      entityId: placeId,
      pinned: pin.pinned,
    });
  }
  for (const [eventId, pin] of Object.entries(state.people)) {
    const ev = ctx.events.find((e) => e.id === eventId);
    const prof = ctx.profiles[eventId];
    if (!ev || (ev.type !== "person" && ev.type !== "ruler")) continue;
    if (prof?.hidden) continue;
    markers.push({
      nx: clampAtlasCoord(pin.nx),
      ny: clampAtlasCoord(pin.ny),
      label: prof?.name || ev.title,
      href: `/timeline/person/${eventId}`,
      imageSrc: prof?.imageDataUrl ?? null,
      fallbackEmoji: ev.icon ?? "👤",
      kind: "person",
      entityId: eventId,
      pinned: pin.pinned,
    });
  }
  markers.sort((a, b) => a.label.localeCompare(b.label));
  return markers;
}

export function atlasMarkersForCatalogMap(
  catalogMapId: string,
  ctx: {
    events: TimelineEvent[];
    profiles: Record<string, PersonProfile>;
    places: Record<string, PlaceRecord>;
  },
): AtlasMapMarkerView[] {
  const markers: AtlasMapMarkerView[] = [];
  for (const p of Object.values(ctx.places)) {
    const pin = p.atlasPin;
    if (!pin || pin.catalogMapId !== catalogMapId) continue;
    markers.push({
      nx: clampAtlasCoord(pin.nx),
      ny: clampAtlasCoord(pin.ny),
      label: p.name,
      href: `/places/${p.id}`,
      imageSrc: p.imageDataUrl ?? null,
      fallbackEmoji: "📍",
      kind: "place",
      entityId: p.id,
    });
  }
  for (const ev of ctx.events) {
    if (ev.type !== "person" && ev.type !== "ruler") continue;
    const prof = ctx.profiles[ev.id];
    if (prof?.hidden) continue;
    const pin = prof?.atlasPin;
    if (!pin || pin.catalogMapId !== catalogMapId) continue;
    markers.push({
      nx: clampAtlasCoord(pin.nx),
      ny: clampAtlasCoord(pin.ny),
      label: prof?.name || ev.title,
      href: `/timeline/person/${ev.id}`,
      imageSrc: prof?.imageDataUrl ?? null,
      fallbackEmoji: ev.icon ?? "👤",
      kind: "person",
      entityId: ev.id,
    });
  }
  markers.sort((a, b) => a.label.localeCompare(b.label));
  return markers;
}
