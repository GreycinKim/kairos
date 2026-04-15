import type { BiblicalRouteDef } from "@/lib/biblicalRoutesCatalog";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { bookFromScriptureRef, type BibleMapLocationJson, locationMentionsBook } from "@/lib/bookCitiesFromLocations";

const BOOKS_LONGEST_FIRST = [...ALL_BIBLE_BOOKS].sort((a, b) => b.length - a.length);

/** All verse-style strings attached to a route (summary ref + per-segment refs). */
export function biblicalRouteRefStrings(route: BiblicalRouteDef): string[] {
  const out: string[] = [];
  if (route.bibleRef?.trim()) out.push(route.bibleRef.trim());
  for (const s of route.segments ?? []) {
    if (s.ref?.trim()) out.push(s.ref.trim());
  }
  return out;
}

function collectPlaceIds(route: BiblicalRouteDef): string[] {
  const ids = new Set<string>();
  for (const id of route.stopPlaceIds ?? []) ids.add(id);
  for (const s of route.segments ?? []) {
    ids.add(s.from);
    ids.add(s.to);
  }
  return [...ids];
}

function stripLeadingBook(fragment: string, book: string): string | null {
  const t = fragment.trim();
  const prefix = `${book} `;
  if (!t.startsWith(prefix)) return null;
  return t.slice(prefix.length).trim();
}

/**
 * Chapters touched in one ref fragment that already matches `book` (e.g. "11:31–12:9" after "Genesis ").
 */
function chaptersInBookFragment(book: string, fragment: string): Set<number> | null {
  const rest = stripLeadingBook(fragment, book);
  if (rest == null) return null;
  const norm = rest.replace(/\u2013|\u2014/g, "-");
  const mChSpan = /^(\d{1,3})\s*-\s*(\d{1,3})$/.exec(norm);
  if (mChSpan) {
    const a = Number(mChSpan[1]);
    const b = Number(mChSpan[2]);
    const out = new Set<number>();
    for (let c = Math.min(a, b); c <= Math.max(a, b); c += 1) out.add(c);
    return out;
  }
  const mSameChapterVerses = /^(\d{1,3}):\d+[-–]\d+$/.exec(norm);
  if (mSameChapterVerses) return new Set([Number(mSameChapterVerses[1])]);
  const mVerseSpan = /^(\d{1,3}):.+?[-–]\s*(\d{1,3})(?::|$)/.exec(norm);
  if (mVerseSpan) {
    const a = Number(mVerseSpan[1]);
    const b = Number(mVerseSpan[2]);
    const out = new Set<number>();
    for (let c = Math.min(a, b); c <= Math.max(a, b); c += 1) out.add(c);
    return out;
  }
  const mSingle = /^(\d{1,3})(?::|\.|\s|$)/.exec(norm);
  if (mSingle) return new Set([Number(mSingle[1])]);
  return null;
}

function expandRefPieces(raw: string, defaultBook: string | null): string[] {
  const pieces = raw.split(";").map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const piece of pieces) {
    if (BOOKS_LONGEST_FIRST.some((b) => piece.startsWith(`${b} `))) {
      out.push(piece);
      continue;
    }
    if (defaultBook && /^\d/.test(piece)) {
      out.push(`${defaultBook} ${piece}`);
      continue;
    }
    out.push(piece);
  }
  return out;
}

/** True if any catalog ref names this book (WEB-style names). */
export function biblicalRouteMentionsBook(
  route: BiblicalRouteDef,
  book: string,
  locations?: BibleMapLocationJson[] | null,
): boolean {
  const b = book.trim();
  if (!b) return true;
  const refs = biblicalRouteRefStrings(route);
  if (refs.length) {
    for (const raw of refs) {
      const bookHead = bookFromScriptureRef(raw) ?? bookFromScriptureRef(raw.split(";")[0]?.trim() ?? "");
      const pieces = expandRefPieces(raw, bookHead);
      for (const piece of pieces) {
        if (bookFromScriptureRef(piece) === b) return true;
      }
    }
    return false;
  }
  if (locations?.length) {
    const byId = new Map(locations.map((loc) => [loc.id, loc]));
    for (const id of collectPlaceIds(route)) {
      const loc = byId.get(id);
      if (loc && locationMentionsBook(loc, b)) return true;
    }
  }
  return false;
}

/** True if the route is tied to `book` and any parsed passage touches `chapter`. */
export function biblicalRouteMentionsBookChapter(
  route: BiblicalRouteDef,
  book: string,
  chapter: number,
  locations?: BibleMapLocationJson[] | null,
): boolean {
  if (!biblicalRouteMentionsBook(route, book, locations)) return false;
  const b = book.trim();
  const union = new Set<number>();
  for (const raw of biblicalRouteRefStrings(route)) {
    const bookHead = bookFromScriptureRef(raw) ?? bookFromScriptureRef(raw.split(";")[0]?.trim() ?? "");
    const pieces = expandRefPieces(raw, bookHead);
    for (const piece of pieces) {
      if (bookFromScriptureRef(piece) !== b) continue;
      const ch = chaptersInBookFragment(b, piece);
      if (ch) ch.forEach((n) => union.add(n));
    }
  }
  if (union.size === 0) {
    if (!locations?.length) return false;
    const byId = new Map(locations.map((loc) => [loc.id, loc]));
    for (const id of collectPlaceIds(route)) {
      const loc = byId.get(id);
      if (!loc) continue;
      for (const row of loc.scripture ?? []) {
        if (bookFromScriptureRef(row.ref) !== b) continue;
        const ch = chaptersInBookFragment(b, row.ref);
        if (ch?.has(chapter)) return true;
      }
    }
    return false;
  }
  return union.has(chapter);
}

export type BiblicalRouteListScope = "all" | "book" | "chapter";

export function filterBiblicalRoutesForReader(
  routes: BiblicalRouteDef[],
  book: string,
  chapter: number | undefined,
  scope: BiblicalRouteListScope,
  locations?: BibleMapLocationJson[] | null,
): BiblicalRouteDef[] {
  if (scope === "all" || !book.trim()) return routes;
  const ch = chapter ?? 1;
  if (scope === "book") return routes.filter((r) => biblicalRouteMentionsBook(r, book, locations));
  return routes.filter((r) => biblicalRouteMentionsBookChapter(r, book, ch, locations));
}

/** Unique non-empty `person` labels for UI pickers (sorted). */
export function distinctRoutePersons(routes: BiblicalRouteDef[]): string[] {
  const s = new Set<string>();
  for (const r of routes) {
    const p = r.person?.trim();
    if (p) s.add(p);
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

export type RouteEntityQuick = "" | "__untagged__" | string;

/**
 * Narrow routes by figure / entity.
 * - If `contains` is non-empty: substring match on `person` or `label` (case-insensitive).
 * - Else if `quick === "__untagged__"`: routes with no `person`.
 * - Else if `quick` is a non-empty string: exact match on trimmed `person`.
 */
export function filterBiblicalRoutesByEntity(
  routes: BiblicalRouteDef[],
  contains: string,
  quick: RouteEntityQuick,
): BiblicalRouteDef[] {
  const t = contains.trim().toLowerCase();
  if (t) {
    return routes.filter(
      (r) =>
        (r.person ?? "").toLowerCase().includes(t) ||
        (r.label ?? "").toLowerCase().includes(t) ||
        (r.description ?? "").toLowerCase().includes(t),
    );
  }
  if (quick === "__untagged__") return routes.filter((r) => !r.person?.trim());
  if (quick) return routes.filter((r) => (r.person ?? "").trim() === quick);
  return routes;
}
