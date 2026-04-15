import { api } from "@/api/client";
import type { AtlasMapPin } from "@/lib/mapAtlasTypes";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { bumpWorkspaceEpoch } from "@/lib/workspaceRemoteSync";

export type PeopleScope = "bible" | "church_history";

/** Used for People tab ordering and grouping (edit on each person). */
export type PersonFigureKind =
  | "patriarch"
  | "king"
  | "prophet"
  | "priest"
  | "disciple"
  | "apostle"
  | "angel"
  | "region"
  | "other";

export const PERSON_FIGURE_KINDS: PersonFigureKind[] = [
  "patriarch",
  "king",
  "prophet",
  "priest",
  "disciple",
  "apostle",
  "angel",
  "region",
  "other",
];

export const PERSON_FIGURE_KIND_LABELS: Record<PersonFigureKind, string> = {
  patriarch: "Patriarch",
  king: "King",
  prophet: "Prophet",
  priest: "Priest",
  disciple: "Disciple",
  apostle: "Apostle",
  angel: "Angel",
  region: "Region",
  other: "Other / unspecified",
};

const FIGURE_ORDER: PersonFigureKind[] = [
  "patriarch",
  "king",
  "prophet",
  "priest",
  "disciple",
  "apostle",
  "angel",
  "region",
];

export function figureKindSortIndex(kind: PersonFigureKind | undefined): number {
  if (!kind || kind === "other") return FIGURE_ORDER.length + 1;
  const i = FIGURE_ORDER.indexOf(kind);
  return i === -1 ? FIGURE_ORDER.length : i;
}

export function profileAppearsInAnyBookSet(profile: PersonProfile, books: ReadonlySet<string>): boolean {
  if (books.size === 0) return true;
  const rows = profile.scriptureAppearances ?? [];
  if (!rows.length) return false;
  return rows.some((r) => books.has(r.book));
}

export type LoreCardKind = "item" | "clothing" | "place" | "event";

/** Short encyclopedia-style entry (items, garments, sites, life events). */
export type LoreCard = {
  kind: LoreCardKind;
  title: string;
  body: string;
  /** Optional illustration (e.g. data URL from Edit person). */
  imageDataUrl?: string | null;
};

export type LoreCallout = {
  title: string;
  body: string;
};

/** Optional family graph edges from this person to other people (timeline person/ruler ids). */
export type FamilyLinkRelation =
  | "parent"
  | "step_parent"
  | "child"
  | "step_son"
  | "step_daughter"
  | "spouse"
  | "concubine"
  | "sibling"
  | "step_brother"
  | "step_sister"
  | "cousin"
  | "step_cousin"
  | "other";

export type FamilyLink = {
  relation: FamilyLinkRelation;
  personEventId: string;
};

/** Human-readable labels for UI and the family tree modal. */
export const FAMILY_RELATION_LABEL: Record<FamilyLinkRelation, string> = {
  parent: "Parent",
  step_parent: "Step-parent",
  child: "Child",
  step_son: "Step-son",
  step_daughter: "Step-daughter",
  spouse: "Spouse",
  concubine: "Concubine",
  sibling: "Sibling",
  step_brother: "Step-brother",
  step_sister: "Step-sister",
  cousin: "Cousin",
  step_cousin: "Step-cousin",
  other: "Related",
};

/** Select / form order: nuclear first, then step & extended. */
export const FAMILY_LINK_RELATION_OPTIONS: { value: FamilyLinkRelation; label: string }[] = [
  { value: "parent", label: FAMILY_RELATION_LABEL.parent },
  { value: "step_parent", label: FAMILY_RELATION_LABEL.step_parent },
  { value: "child", label: FAMILY_RELATION_LABEL.child },
  { value: "step_son", label: FAMILY_RELATION_LABEL.step_son },
  { value: "step_daughter", label: FAMILY_RELATION_LABEL.step_daughter },
  { value: "spouse", label: FAMILY_RELATION_LABEL.spouse },
  { value: "concubine", label: FAMILY_RELATION_LABEL.concubine },
  { value: "sibling", label: FAMILY_RELATION_LABEL.sibling },
  { value: "step_brother", label: FAMILY_RELATION_LABEL.step_brother },
  { value: "step_sister", label: FAMILY_RELATION_LABEL.step_sister },
  { value: "cousin", label: FAMILY_RELATION_LABEL.cousin },
  { value: "step_cousin", label: FAMILY_RELATION_LABEL.step_cousin },
  { value: "other", label: FAMILY_RELATION_LABEL.other },
];

/** Where this person appears in scripture (for reader + People filters). */
export type ScriptureAppearance = {
  book: string;
  chapter: number;
};

/**
 * Coerces and drops invalid rows (missing book/chapter) so sorts and links never call
 * `localeCompare` on undefined — common after hand-edited JSON or partial imports.
 */
export function normalizeScriptureAppearances(rows: readonly unknown[] | null | undefined): ScriptureAppearance[] {
  if (!rows || !Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const out: ScriptureAppearance[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const bookRaw = o.book;
    const book =
      typeof bookRaw === "string"
        ? bookRaw.trim()
        : typeof bookRaw === "number" && Number.isFinite(bookRaw)
          ? String(bookRaw)
          : "";
    if (!book) continue;
    const chRaw = o.chapter;
    let chapter: number;
    if (typeof chRaw === "number" && Number.isFinite(chRaw)) chapter = Math.max(1, Math.floor(chRaw));
    else if (typeof chRaw === "string") {
      const n = parseInt(chRaw.trim(), 10);
      if (!Number.isFinite(n) || n < 1) continue;
      chapter = n;
    } else continue;
    const key = `${book}\0${chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ book, chapter });
  }
  return out;
}

/**
 * Collapses consecutive chapters per book for display (e.g. 1 Samuel 15–20).
 * Underlying `ScriptureAppearance[]` stays one row per chapter for the reader and filters.
 */
export type ScriptureFootprintDisplayRange = {
  book: string;
  /** Single chapter ("7") or inclusive range ("15–20"). */
  chapterDisplay: string;
  chapters: number[];
};

export function groupScriptureAppearancesForDisplay(rows: readonly ScriptureAppearance[]): ScriptureFootprintDisplayRange[] {
  const normalized = [...rows].sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter);
  if (!normalized.length) return [];
  const byBook = new Map<string, number[]>();
  for (const r of normalized) {
    const arr = byBook.get(r.book) ?? [];
    arr.push(r.chapter);
    byBook.set(r.book, arr);
  }
  const bookKeys = [...byBook.keys()].sort((a, b) => {
    const ia = ALL_BIBLE_BOOKS.indexOf(a);
    const ib = ALL_BIBLE_BOOKS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const out: ScriptureFootprintDisplayRange[] = [];
  for (const book of bookKeys) {
    const chs = [...new Set(byBook.get(book) ?? [])].sort((x, y) => x - y);
    let i = 0;
    while (i < chs.length) {
      const start = chs[i]!;
      let j = i;
      while (j + 1 < chs.length && chs[j + 1]! === chs[j]! + 1) j++;
      const end = chs[j]!;
      const slice = chs.slice(i, j + 1);
      out.push({
        book,
        chapterDisplay: start === end ? String(start) : `${start}\u2013${end}`,
        chapters: slice,
      });
      i = j + 1;
    }
  }
  return out;
}

export type PersonProfile = {
  eventId: string;
  name: string;
  scope: PeopleScope;
  /** Kings, prophets, etc. — controls sort order on the People tab. */
  figureKind?: PersonFigureKind;
  title?: string;
  biography?: string;
  diedYear?: number | null;
  ruledFromYear?: number | null;
  ruledToYear?: number | null;
  imageDataUrl?: string | null;
  hidden?: boolean;
  relatedEventIds?: string[];
  /** Book + chapter rows you curate; powers “figures in this chapter” and People filters. */
  scriptureAppearances?: ScriptureAppearance[];
  loreCards?: LoreCard[];
  loreCallouts?: LoreCallout[];
  familyLinks?: FamilyLink[];
  /** Optional token position on a workspace atlas plate (reader / maps). */
  atlasPin?: AtlasMapPin;
};

export const PEOPLE_PROFILES_STORAGE_KEY = "kairos-timeline-people-profiles-v1";
const LS_KEY = PEOPLE_PROFILES_STORAGE_KEY;

let profilesSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function profileAppearsInChapter(
  profile: PersonProfile,
  book: string,
  chapter: number,
): boolean {
  const rows = profile.scriptureAppearances ?? [];
  if (!rows.length) return false;
  return rows.some((r) => r.book === book && r.chapter === chapter);
}

export function profileAppearsInBook(profile: PersonProfile, book: string): boolean {
  const rows = profile.scriptureAppearances ?? [];
  if (!rows.length) return false;
  return rows.some((r) => r.book === book);
}

export function loadPeopleProfiles(): Record<string, PersonProfile> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PersonProfile>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

/** Persists profiles to localStorage and debounced `PUT /library/person-profiles`. */
export function savePeopleProfiles(data: Record<string, PersonProfile>): boolean {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    return false;
  }
  if (profilesSaveTimer) clearTimeout(profilesSaveTimer);
  profilesSaveTimer = setTimeout(() => {
    profilesSaveTimer = null;
    const latest = loadPeopleProfiles();
    void api.put("/library/person-profiles", { profiles: latest }).catch(() => {
      /* offline */
    });
  }, 900);
  return true;
}

/** Push current localStorage snapshot immediately (e.g. tab hidden). */
export function flushPeopleProfilesSaveNow(): void {
  if (profilesSaveTimer) {
    clearTimeout(profilesSaveTimer);
    profilesSaveTimer = null;
  }
  const data = loadPeopleProfiles();
  void api.put("/library/person-profiles", { profiles: data }).catch(() => {
    /* offline */
  });
}

/** Pull server profiles into localStorage (and bump UI listeners via workspace epoch). */
export async function hydratePeopleProfilesFromServer(): Promise<void> {
  try {
    const { data } = await api.get<{ profiles: Record<string, PersonProfile> }>("/library/person-profiles");
    const remote = data?.profiles ?? {};
    if (Object.keys(remote).length > 0) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(remote));
      bumpWorkspaceEpoch();
      return;
    }
    const local = loadPeopleProfiles();
    if (Object.keys(local).length > 0) {
      await api.put("/library/person-profiles", { profiles: local });
      bumpWorkspaceEpoch();
    }
  } catch {
    /* offline */
  }
}

export function toYearLabel(year: number | null | undefined): string {
  if (year == null || Number.isNaN(year)) return "Unknown";
  if (year <= 0) return `${Math.abs(year)} BC`;
  return `${year} AD`;
}

