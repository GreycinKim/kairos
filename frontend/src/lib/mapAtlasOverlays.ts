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
};

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
    });
  }
  for (const ev of ctx.events) {
    if (ev.type !== "person" && ev.type !== "ruler") continue;
    const prof = ctx.profiles[ev.id];
    const pin = prof?.atlasPin;
    if (!pin || pin.catalogMapId !== catalogMapId) continue;
    markers.push({
      nx: clampAtlasCoord(pin.nx),
      ny: clampAtlasCoord(pin.ny),
      label: prof?.name || ev.title,
      href: `/timeline/person/${ev.id}`,
      imageSrc: prof?.imageDataUrl ?? null,
      fallbackEmoji: ev.icon ?? "👤",
    });
  }
  markers.sort((a, b) => a.label.localeCompare(b.label));
  return markers;
}
