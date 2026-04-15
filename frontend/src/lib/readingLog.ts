import { api } from "@/api/client";
import { CHAPTER_COUNT } from "@/lib/bibleCanon";

export type ReadingLogEvent = {
  id: string;
  book: string;
  chapter: number;
  at: string;
};

/** Bump when you want all clients to start from an empty log (localStorage key change). */
export const READING_LOG_STORAGE_KEY = "kairos-reading-log-v2";

/** Same-tab updates (API sync) — `storage` only fires across tabs. */
export const READING_LOG_CHANGED_EVENT = "kairos-reading-log-changed";

const STORAGE_KEY = READING_LOG_STORAGE_KEY;

function emitReadingLogChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(READING_LOG_CHANGED_EVENT));
}

function coerceAtToIso(at: unknown): string | null {
  if (typeof at === "string" && at.length > 0) return at;
  if (typeof at === "number" && Number.isFinite(at)) return new Date(at).toISOString();
  if (at instanceof Date && !Number.isNaN(at.getTime())) return at.toISOString();
  return null;
}

function parseReadingLogEvent(raw: unknown): ReadingLogEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.book !== "string") return null;
  const chRaw = o.chapter;
  if (typeof chRaw !== "number" || !Number.isFinite(chRaw)) return null;
  const chapter = Math.max(1, Math.floor(chRaw));
  const at = coerceAtToIso(o.at);
  if (!at) return null;
  return { id: o.id, book: o.book, chapter, at };
}

export const CANON_BOOK_ORDER = Object.keys(CHAPTER_COUNT) as (keyof typeof CHAPTER_COUNT)[];

export const TOTAL_CANON_CHAPTERS = CANON_BOOK_ORDER.reduce((sum, b) => sum + (CHAPTER_COUNT[b] ?? 0), 0);

export function loadReadingLog(): ReadingLogEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ReadingLogEvent =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as ReadingLogEvent).id === "string" &&
        typeof (x as ReadingLogEvent).book === "string" &&
        typeof (x as ReadingLogEvent).chapter === "number" &&
        typeof (x as ReadingLogEvent).at === "string",
    );
  } catch {
    return [];
  }
}

export function saveReadingLog(events: ReadingLogEvent[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    emitReadingLogChanged();
  } catch {
    /* ignore */
  }
}

/** Load canonical log from the API into localStorage (offline cache). */
export async function refreshReadingLogFromServer(): Promise<ReadingLogEvent[]> {
  try {
    const { data } = await api.get<unknown[]>("/reading-log");
    const rows = Array.isArray(data) ? data : [];
    const parsed = rows.map(parseReadingLogEvent).filter((x): x is ReadingLogEvent => Boolean(x));
    saveReadingLog(parsed);
    return parsed;
  } catch {
    return loadReadingLog();
  }
}

/** One-time upload of legacy browser-only log rows (skipped if server already has entries). */
export async function migrateReadingLogLocalToServer(): Promise<void> {
  try {
    const { data } = await api.get<unknown[]>("/reading-log");
    if (Array.isArray(data) && data.length > 0) return;
    const local = loadReadingLog();
    if (local.length === 0) return;
    await api.post("/reading-log/bulk", { events: local });
    await refreshReadingLogFromServer();
  } catch {
    /* offline */
  }
}

export async function appendReading(book: string, chapter: number, at = new Date()): Promise<ReadingLogEvent[]> {
  await api.post("/reading-log", {
    book,
    chapter,
    at: at.toISOString(),
  });
  return refreshReadingLogFromServer();
}

function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function parseISODate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventsInRange(events: ReadingLogEvent[], from: Date, to: Date): ReadingLogEvent[] {
  const a = dayStart(from).getTime();
  const b = dayStart(to).getTime() + 864e5 - 1;
  return events.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= a && t <= b;
  });
}

/** book → chapter → read count in inclusive date range */
export function chapterCountsInRange(
  events: ReadingLogEvent[],
  from: Date,
  to: Date,
): Map<string, Map<number, number>> {
  const filtered = eventsInRange(events, from, to);
  const out = new Map<string, Map<number, number>>();
  for (const e of filtered) {
    const book = e.book;
    const maxCh = CHAPTER_COUNT[book];
    if (maxCh === undefined) continue;
    const ch = Math.min(Math.max(1, e.chapter), maxCh);
    if (!out.has(book)) out.set(book, new Map());
    const m = out.get(book)!;
    m.set(ch, (m.get(ch) ?? 0) + 1);
  }
  return out;
}

export function uniqueChaptersInRange(events: ReadingLogEvent[], from: Date, to: Date): number {
  const keys = new Set<string>();
  for (const e of eventsInRange(events, from, to)) {
    if (!(e.book in CHAPTER_COUNT)) continue;
    keys.add(`${e.book}:${e.chapter}`);
  }
  return keys.size;
}

/** yyyy-mm-dd → number of log entries that calendar day */
export function readsPerDayInMonth(
  events: ReadingLogEvent[],
  year: number,
  monthIndex: number,
): Map<string, number> {
  const map = new Map<string, number>();
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  for (const e of eventsInRange(events, start, end)) {
    const d = new Date(e.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar yyyy-mm-dd for an ISO timestamp (browser local timezone). */
export function localDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function canonBookIndex(book: string): number {
  const i = CANON_BOOK_ORDER.indexOf(book as (typeof CANON_BOOK_ORDER)[number]);
  return i >= 0 ? i : 9999;
}

function sortPassages(a: { book: string; chapter: number }, b: { book: string; chapter: number }): number {
  const ia = canonBookIndex(a.book);
  const ib = canonBookIndex(b.book);
  if (ia !== ib) return ia - ib;
  return a.chapter - b.chapter;
}

/** Each local calendar day → unique passages read that day (sorted canonically). */
export function passagesByLocalDay(events: ReadingLogEvent[]): Map<string, { book: string; chapter: number }[]> {
  const raw = new Map<string, Map<string, { book: string; chapter: number }>>();
  for (const e of events) {
    if (!(e.book in CHAPTER_COUNT)) continue;
    const day = localDateKeyFromIso(e.at);
    const dedupeKey = `${e.book}\0${e.chapter}`;
    if (!raw.has(day)) raw.set(day, new Map());
    raw.get(day)!.set(dedupeKey, { book: e.book, chapter: e.chapter });
  }
  const out = new Map<string, { book: string; chapter: number }[]>();
  for (const [day, inner] of raw) {
    out.set(day, [...inner.values()].sort(sortPassages));
  }
  return out;
}

/**
 * Consecutive local days with at least one reading log.
 * If today has no log yet, yesterday can still continue the streak (same calendar day grace).
 */
export function readingStreakDays(events: ReadingLogEvent[]): number {
  const days = new Set<string>();
  for (const e of events) {
    days.add(localDateKeyFromIso(e.at));
  }
  const fmt = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  if (!days.has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(fmt(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(fmt(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
