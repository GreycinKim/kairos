import { create } from "zustand";

import { api } from "@/api/client";
import type { TimelineEvent, ZoomLevel } from "@/types";
import { TIMELINE_MAX_YEAR, TIMELINE_MIN_YEAR } from "@/lib/timelineMath";

export const ZOOM_PX: Record<ZoomLevel, number> = {
  millennium: 0.32,
  century: 0.72,
  decade: 1.85,
  year: 8.5,
  /** Tighter than “year” for reading short spans and dense markers. */
  detail: 26,
};

export const TIMELINE_PX_MIN = Math.min(...Object.values(ZOOM_PX));
export const TIMELINE_PX_MAX = Math.max(...Object.values(ZOOM_PX));

const PX_MIN = TIMELINE_PX_MIN;
const PX_MAX = TIMELINE_PX_MAX;

function nearestZoomLevel(px: number): ZoomLevel {
  let best: ZoomLevel = "century";
  let bestDiff = Infinity;
  for (const z of Object.keys(ZOOM_PX) as ZoomLevel[]) {
    const v = ZOOM_PX[z];
    const d = Math.abs(v - px);
    if (d < bestDiff) {
      bestDiff = d;
      best = z;
    }
  }
  return best;
}

export type LayerKey = "showBible" | "showWorld" | "showPersonal";

interface TimelineState {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  zoom: ZoomLevel;
  pxPerYear: number;
  showBible: boolean;
  showWorld: boolean;
  showPersonal: boolean;
  selectedEventId: string | null;
  fetchEvents: () => Promise<void>;
  setZoom: (z: ZoomLevel) => void;
  /** Live update while dragging the zoom rail (clamped). Does not change discrete `zoom` until commit. */
  setPxPerYearLive: (px: number) => void;
  /** Snap `pxPerYear` and `zoom` to the closest preset level after a drag ends. */
  commitPxPerYearZoom: () => void;
  /** Update the discrete `zoom` key to match current `pxPerYear` without changing pixels (e.g. after wheel zoom). */
  syncZoomUiOnly: () => void;
  setLayer: (key: LayerKey, v: boolean) => void;
  selectEvent: (id: string | null) => void;
  addLocalEvent: (e: TimelineEvent) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  zoom: "century",
  pxPerYear: ZOOM_PX.century,
  showBible: true,
  showWorld: true,
  showPersonal: true,
  selectedEventId: null,

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<TimelineEvent[]>("/timeline/events");
      set({ events: data, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load timeline",
      });
    }
  },

  setZoom: (z) => set({ zoom: z, pxPerYear: ZOOM_PX[z] }),

  setPxPerYearLive: (px) =>
    set({ pxPerYear: Math.min(PX_MAX, Math.max(PX_MIN, px)) }),

  commitPxPerYearZoom: () => {
    const px = get().pxPerYear;
    const z = nearestZoomLevel(px);
    set({ zoom: z, pxPerYear: ZOOM_PX[z] });
  },

  syncZoomUiOnly: () => {
    set({ zoom: nearestZoomLevel(get().pxPerYear) });
  },

  setLayer: (key, v) => set({ [key]: v }),

  selectEvent: (id) => set({ selectedEventId: id }),

  addLocalEvent: (e) => set({ events: [...get().events, e] }),
}));

export type LayerFilters = Pick<TimelineState, "showBible" | "showWorld" | "showPersonal">;

/** Three bands: Scripture | World (empires + rulers + people) | Personal */
export function filterEventsByLayer(ev: TimelineEvent, layers: LayerFilters): boolean {
  if (!layers.showBible && !layers.showWorld && !layers.showPersonal) return false;
  switch (ev.type) {
    case "bible_book":
      return layers.showBible;
    case "empire":
    case "ruler":
    case "person":
      return layers.showWorld;
    case "journal":
    case "milestone":
      return layers.showPersonal;
    default:
      return true;
  }
}

/** Spiritual journey: only personal types */
export function filterSpiritualOnly(ev: TimelineEvent): boolean {
  return ev.type === "milestone" || ev.type === "journal";
}

export { TIMELINE_MIN_YEAR, TIMELINE_MAX_YEAR };
