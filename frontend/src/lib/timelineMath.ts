import type { TimelineEvent } from "@/types";

const MS_PER_DAY = 86400000;

function isoDateToFractionalYear(iso: string): number {
  const parts = iso.split("-").map(Number);
  const y = parts[0]!;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const t = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 1);
  const frac = (t - start) / (365.25 * MS_PER_DAY);
  return y + frac;
}

/** Map event to a numeric timeline position (fractional years; BC = negative). */
export function eventStartYear(ev: TimelineEvent): number {
  if (ev.start_date) {
    return isoDateToFractionalYear(ev.start_date);
  }
  if (ev.start_year != null) return ev.start_year;
  return 0;
}

export function eventEndYear(ev: TimelineEvent): number {
  if (ev.end_date) {
    return isoDateToFractionalYear(ev.end_date);
  }
  if (ev.end_year != null) return ev.end_year;
  if (ev.start_year != null) return ev.start_year;
  if (ev.start_date) return eventStartYear(ev);
  return eventStartYear(ev);
}

export function todayFractionalYear(): number {
  const d = new Date();
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const frac = (d.getTime() - start) / (365.25 * MS_PER_DAY);
  return y + frac;
}

export const TIMELINE_MIN_YEAR = -4000;
export const TIMELINE_MAX_YEAR = 2035;

export const ERA_BANDS = [
  { id: "patriarchal", label: "Patriarchal", startYear: -4000, endYear: -1800, tint: "rgba(201,168,76,0.06)" },
  { id: "mosaic", label: "Mosaic", startYear: -1800, endYear: -1050, tint: "rgba(107,143,113,0.07)" },
  { id: "kingdom", label: "Kingdom", startYear: -1050, endYear: -586, tint: "rgba(154,139,107,0.07)" },
  { id: "exile", label: "Exile", startYear: -586, endYear: -332, tint: "rgba(184,92,92,0.06)" },
  { id: "intertestamental", label: "Intertestamental", startYear: -332, endYear: 30, tint: "rgba(100,116,139,0.07)" },
  { id: "nt", label: "New Testament", startYear: 30, endYear: 100, tint: "rgba(201,168,76,0.08)" },
  { id: "church", label: "Church History", startYear: 100, endYear: 1750, tint: "rgba(107,143,113,0.05)" },
  { id: "modern", label: "Modern", startYear: 1750, endYear: 1945, tint: "rgba(148,163,184,0.06)" },
  { id: "present", label: "Present", startYear: 1945, endYear: TIMELINE_MAX_YEAR, tint: "rgba(201,168,76,0.05)" },
] as const;

export function yearToX(y: number, minY: number, pxPerYear: number): number {
  return (y - minY) * pxPerYear;
}

/** Midpoint of composition / written range for bible books (marker dot). */
export function writtenMidYear(ev: TimelineEvent): number | null {
  if (ev.written_start_year == null) return null;
  const a = ev.written_start_year;
  const b = ev.written_end_year ?? a;
  return (a + b) / 2;
}
