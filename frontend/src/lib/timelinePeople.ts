import type { AtlasMapPin } from "@/lib/mapAtlasTypes";

export type PeopleScope = "bible" | "church_history";

/** Used for People tab ordering and grouping (edit on each person). */
export type PersonFigureKind =
  | "king"
  | "prophet"
  | "priest"
  | "disciple"
  | "apostle"
  | "angel"
  | "region"
  | "other";

export const PERSON_FIGURE_KINDS: PersonFigureKind[] = [
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
};

export type LoreCallout = {
  title: string;
  body: string;
};

/** Optional family graph edges from this person to other people (timeline person/ruler ids). */
export type FamilyLinkRelation = "parent" | "child" | "spouse" | "sibling" | "other";

export type FamilyLink = {
  relation: FamilyLinkRelation;
  personEventId: string;
};

/** Where this person appears in scripture (for reader + People filters). */
export type ScriptureAppearance = {
  book: string;
  chapter: number;
};

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

const LS_KEY = "kairos-timeline-people-profiles-v1";

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

export function savePeopleProfiles(data: Record<string, PersonProfile>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function toYearLabel(year: number | null | undefined): string {
  if (year == null || Number.isNaN(year)) return "Unknown";
  if (year <= 0) return `${Math.abs(year)} BC`;
  return `${year} AD`;
}

