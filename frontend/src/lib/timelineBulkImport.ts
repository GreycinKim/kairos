import { api } from "@/api/client";
import {
  PERSON_FIGURE_KINDS,
  loadPeopleProfiles,
  savePeopleProfiles,
  type FamilyLink,
  type PersonFigureKind,
  type PersonProfile,
} from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";

export type PeoplePackRow = {
  slug: string;
  timeline_event: {
    title: string;
    type: string;
    start_year?: number | null;
    end_year?: number | null;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    era?: string | null;
    author?: string | null;
    written_start_year?: number | null;
    written_end_year?: number | null;
  };
  profile: Partial<PersonProfile> & { name: string; scope: PersonProfile["scope"] };
};

export type PeoplePackJson = {
  source?: string;
  /** Canonical `PeoplePackRow` or flat rows (`name`, `eventId`, optional `familyLinks` with `type` + `targetEventId`). */
  people: PeoplePackRow[] | unknown[];
};

export type ImportOk = { slug: string; eventId: string; title: string };
export type ImportFail = { slug: string; error: string };

function coerceFigureKind(k: unknown): PersonFigureKind | undefined {
  if (typeof k !== "string") return undefined;
  return (PERSON_FIGURE_KINDS as readonly string[]).includes(k) ? (k as PersonFigureKind) : "other";
}

function normalizePeopleScope(s: unknown): PersonProfile["scope"] | null {
  if (s === "bible" || s === "church_history") return s;
  if (s === "OT" || s === "NT") return "bible";
  return null;
}

function buildProfile(eventId: string, p: PeoplePackRow["profile"]): PersonProfile {
  const scope = p.scope === "church_history" ? "church_history" : "bible";
  return {
    eventId,
    name: p.name,
    scope,
    figureKind: coerceFigureKind(p.figureKind),
    title: p.title,
    biography: p.biography,
    diedYear: p.diedYear ?? null,
    ruledFromYear: p.ruledFromYear ?? null,
    ruledToYear: p.ruledToYear ?? null,
    hidden: p.hidden ?? false,
    scriptureAppearances: p.scriptureAppearances,
    loreCards: p.loreCards,
    loreCallouts: p.loreCallouts,
    relatedEventIds: p.relatedEventIds,
    imageDataUrl: p.imageDataUrl,
    familyLinks: p.familyLinks,
    atlasPin: p.atlasPin,
  };
}

/**
 * Creates timeline person events via API and merges `PersonProfile` rows into localStorage.
 */
function slugForRow(row: unknown, index: number): string {
  if (row && typeof row === "object" && "slug" in row && typeof (row as { slug?: unknown }).slug === "string") {
    const s = (row as { slug: string }).slug.trim();
    if (s) return s;
  }
  if (row && typeof row === "object" && "eventId" in row && typeof (row as { eventId?: unknown }).eventId === "string") {
    const e = (row as { eventId: string }).eventId.trim();
    if (e) return e;
  }
  return `row-${index}`;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return null;
}

type ExternalFamilyLink = { type: string; targetEventId: string };

function extractExternalFamilyLinks(raw: unknown): ExternalFamilyLink[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ExternalFamilyLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = (item as { type?: unknown }).type;
    const tid = (item as { targetEventId?: unknown }).targetEventId;
    if (typeof t !== "string" || typeof tid !== "string" || !tid.trim()) continue;
    out.push({ type: t, targetEventId: tid.trim() });
  }
  return out.length ? out : undefined;
}

/**
 * Maps “Genesis-style” link verbs to Kairos `FamilyLink` (see family tree modal).
 * `parent` here means “this person is parent of target” → stored as `child` to target.
 */
function mapExternalFamilyEdge(type: string, targetUuid: string): FamilyLink | null {
  const t = type.trim().toLowerCase();
  if (t === "spouse") return { relation: "spouse", personEventId: targetUuid };
  if (t === "parent") return { relation: "child", personEventId: targetUuid };
  if (t === "childof") return { relation: "parent", personEventId: targetUuid };
  if (t === "siblingof") return { relation: "sibling", personEventId: targetUuid };
  if (t === "ancestorof") return { relation: "other", personEventId: targetUuid };
  return null;
}

function dedupeFamilyLinks(links: FamilyLink[]): FamilyLink[] {
  const seen = new Set<string>();
  return links.filter((l) => {
    const k = `${l.relation}\0${l.personEventId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

type PreparedPeopleRow =
  | { ok: true; slug: string; idKey: string; packRow: PeoplePackRow; externalFamilyLinks?: ExternalFamilyLink[] }
  | { ok: false; slug: string; error: string };

/**
 * Accepts canonical `PeoplePackRow` or flat rows like `{ eventId, name, scope: "OT", familyLinks: [{ type, targetEventId }] }`.
 */
function preparePeopleRow(raw: unknown, index: number): PreparedPeopleRow {
  const slugFallback = slugForRow(raw, index);
  if (!raw || typeof raw !== "object") {
    return { ok: false, slug: slugFallback, error: "Each people[] entry must be an object" };
  }

  const r = raw as Record<string, unknown>;
  const nestedProfile = r.profile;

  if (nestedProfile && typeof nestedProfile === "object") {
    const prof = nestedProfile as PeoplePackRow["profile"];
    const scopeNorm = normalizePeopleScope(prof.scope);
    if (!scopeNorm) {
      return {
        ok: false,
        slug: slugFallback,
        error: `Invalid profile.scope: ${String(prof.scope)}. Use bible, church_history, OT, or NT.`,
      };
    }

    const teRaw = r.timeline_event;
    const te =
      teRaw && typeof teRaw === "object"
        ? (teRaw as PeoplePackRow["timeline_event"])
        : ({} as Partial<PeoplePackRow["timeline_event"]> as PeoplePackRow["timeline_event"]);

    let title = (te.title ?? "").trim();
    if (!title && typeof prof.name === "string") title = prof.name.trim();
    if (!title) {
      return {
        ok: false,
        slug: slugFallback,
        error: "Missing timeline_event.title or profile.name",
      };
    }
    if (typeof prof.name !== "string" || !prof.name.trim()) {
      return { ok: false, slug: slugFallback, error: "Missing profile.name" };
    }

    const ext =
      extractExternalFamilyLinks(r.familyLinks) ?? extractExternalFamilyLinks((prof as { familyLinks?: unknown }).familyLinks);
    const profileForRow: PeoplePackRow["profile"] = {
      ...prof,
      scope: scopeNorm,
      ...(ext ? { familyLinks: undefined } : {}),
    };

    const slug =
      typeof r.slug === "string" && r.slug.trim()
        ? r.slug.trim()
        : typeof r.eventId === "string" && r.eventId.trim()
          ? r.eventId.trim()
          : slugFallback;
    const idKey =
      (typeof r.eventId === "string" && r.eventId.trim() ? r.eventId : prof.name).trim().toLowerCase();

    const packRow: PeoplePackRow = {
      slug,
      timeline_event: { ...te, title: title || prof.name },
      profile: profileForRow,
    };
    return { ok: true, slug, idKey, packRow, externalFamilyLinks: ext };
  }

  // Flat row (no nested profile)
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name) {
    return {
      ok: false,
      slug: slugFallback,
      error: "Missing profile: use nested { profile, timeline_event } or a flat row with name + eventId.",
    };
  }

  const scopeNorm = normalizePeopleScope(r.scope);
  if (r.scope !== undefined && r.scope !== null && !scopeNorm) {
    return {
      ok: false,
      slug: slugFallback,
      error: `Invalid scope: ${String(r.scope)}. Use bible, church_history, OT, or NT.`,
    };
  }
  const scope: PersonProfile["scope"] = scopeNorm ?? "bible";

  const eventIdRaw = typeof r.eventId === "string" ? r.eventId.trim() : "";
  const slug =
    typeof r.slug === "string" && r.slug.trim() ? r.slug.trim() : eventIdRaw || slugFallback;
  const idKey = (eventIdRaw || slug).toLowerCase();

  const ext = extractExternalFamilyLinks(r.familyLinks);

  const profile: PeoplePackRow["profile"] = {
    name,
    scope,
    figureKind: coerceFigureKind(r.figureKind),
    title: typeof r.title === "string" ? r.title : undefined,
    biography: typeof r.biography === "string" ? r.biography : undefined,
    diedYear: numOrNull(r.diedYear),
    ruledFromYear: numOrNull(r.ruledFromYear),
    ruledToYear: numOrNull(r.ruledToYear),
    hidden: Boolean(r.hidden),
    scriptureAppearances: Array.isArray(r.scriptureAppearances) ? (r.scriptureAppearances as PersonProfile["scriptureAppearances"]) : undefined,
    loreCards: Array.isArray(r.loreCards) ? (r.loreCards as PersonProfile["loreCards"]) : undefined,
    loreCallouts: Array.isArray(r.loreCallouts) ? (r.loreCallouts as PersonProfile["loreCallouts"]) : undefined,
    relatedEventIds: Array.isArray(r.relatedEventIds) ? (r.relatedEventIds as string[]) : undefined,
    imageDataUrl: typeof r.imageDataUrl === "string" ? r.imageDataUrl : undefined,
    atlasPin: r.atlasPin && typeof r.atlasPin === "object" ? (r.atlasPin as PersonProfile["atlasPin"]) : undefined,
  };

  const timeline_event: PeoplePackRow["timeline_event"] = {
    title: name,
    type: "person",
    start_year: numOrNull(r.ruledFromYear),
    end_year: numOrNull(r.diedYear),
    description: typeof r.description === "string" ? r.description : null,
    color: typeof r.color === "string" ? r.color : null,
    icon: typeof r.icon === "string" ? r.icon : null,
    era: typeof r.era === "string" ? r.era : null,
    author: typeof r.author === "string" ? r.author : null,
    written_start_year: numOrNull(r.written_start_year),
    written_end_year: numOrNull(r.written_end_year),
  };

  const packRow: PeoplePackRow = { slug, timeline_event, profile };
  return { ok: true, slug, idKey, packRow, externalFamilyLinks: ext };
}

function applyResolvedFamilyLinks(
  idMap: Map<string, string>,
  pending: { eventId: string; links: ExternalFamilyLink[] }[],
): void {
  if (!pending.length) return;
  let profiles = loadPeopleProfiles();
  for (const { eventId, links } of pending) {
    const prof = profiles[eventId];
    if (!prof) continue;
    const resolved: FamilyLink[] = [];
    for (const L of links) {
      const uuid = idMap.get(L.targetEventId.trim().toLowerCase());
      if (!uuid) continue;
      const m = mapExternalFamilyEdge(L.type, uuid);
      if (m) resolved.push(m);
    }
    const merged = dedupeFamilyLinks([...(prof.familyLinks ?? []), ...resolved]);
    profiles = { ...profiles, [eventId]: { ...prof, familyLinks: merged.length ? merged : undefined } };
  }
  savePeopleProfiles(profiles);
}

export async function importPeopleFromPack(
  pack: PeoplePackJson,
  existingPersonTitlesLower: Set<string>,
  options?: { skipDuplicateTitles?: boolean },
): Promise<{ created: ImportOk[]; failed: ImportFail[] }> {
  const created: ImportOk[] = [];
  const failed: ImportFail[] = [];

  if (!Array.isArray(pack.people)) {
    return { created, failed: [{ slug: "_pack", error: 'Expected "people" to be an array' }] };
  }

  const idMap = new Map<string, string>();
  const pendingFamily: { eventId: string; links: ExternalFamilyLink[] }[] = [];

  for (let i = 0; i < pack.people.length; i++) {
    const raw = pack.people[i];
    const prepared = preparePeopleRow(raw, i);
    if (!prepared.ok) {
      failed.push({ slug: prepared.slug, error: prepared.error });
      continue;
    }

    const { slug, idKey, packRow, externalFamilyLinks } = prepared;
    const te = packRow.timeline_event;
    const profile = packRow.profile;

    const title = (te.title ?? profile.name).trim();
    if (!title) {
      failed.push({ slug, error: "Missing title" });
      continue;
    }

    if (options?.skipDuplicateTitles && existingPersonTitlesLower.has(title.toLowerCase())) {
      failed.push({ slug, error: `Skipped duplicate title: ${title}` });
      continue;
    }

    try {
      const payload = {
        title,
        type: te.type || "person",
        start_year: te.start_year ?? null,
        end_year: te.end_year ?? null,
        start_date: null,
        end_date: null,
        description: te.description ?? null,
        color: te.color ?? null,
        icon: te.icon ?? null,
        era: te.era ?? null,
        author: te.author ?? null,
        written_start_year: te.written_start_year ?? null,
        written_end_year: te.written_end_year ?? null,
      };

      const { data } = await api.post<TimelineEvent>("/timeline/events", payload);
      const id = data.id;

      const prev = loadPeopleProfiles();
      const built = buildProfile(id, profile);
      savePeopleProfiles({ ...prev, [id]: built });

      idMap.set(idKey, id);
      idMap.set(slug.toLowerCase(), id);
      idMap.set(profile.name.trim().toLowerCase(), id);

      if (externalFamilyLinks?.length) {
        pendingFamily.push({ eventId: id, links: externalFamilyLinks });
      }

      existingPersonTitlesLower.add(title.toLowerCase());
      created.push({ slug, eventId: id, title: data.title });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      failed.push({ slug, error: msg });
    }
  }

  applyResolvedFamilyLinks(idMap, pendingFamily);

  return { created, failed };
}

export function parsePeoplePackJson(raw: string): PeoplePackJson {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("Top level must be an object");
  const p = parsed as { people?: unknown };
  if (!Array.isArray(p.people)) throw new Error('Expected a "people" array');
  return parsed as PeoplePackJson;
}
