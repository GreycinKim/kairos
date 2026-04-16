import { api } from "@/api/client";
import { bumpWorkspaceEpoch } from "@/lib/workspaceRemoteSync";

/** Normalized marker on the atlas for one book+chapter. */
export type ChapterMarkerPin = {
  nx: number;
  ny: number;
  /** When true, the marker cannot be dragged until unpinned. */
  pinned?: boolean;
};

export type ChapterAtlasState = {
  /** Workspace catalog plate id when not using a custom uploaded image. */
  catalogMapId: string | null;
  /** Optional full-bleed background (data URL). When set, overrides catalog image. */
  customMapDataUrl: string | null;
  people: Record<string, ChapterMarkerPin>;
  places: Record<string, ChapterMarkerPin>;
};

export const CHAPTER_ATLAS_STORAGE_KEY = "kairos-chapter-atlas-v1";
const LS_KEY = CHAPTER_ATLAS_STORAGE_KEY;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let syncReady = false;

export function chapterAtlasKey(book: string, chapter: number): string {
  return `${book.trim()}:${Math.max(1, Math.floor(chapter))}`;
}

export function defaultChapterAtlasState(defaultCatalogId: string | null): ChapterAtlasState {
  return {
    catalogMapId: defaultCatalogId,
    customMapDataUrl: null,
    people: {},
    places: {},
  };
}

export function loadChapterAtlasMap(): Record<string, ChapterAtlasState> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, ChapterAtlasState> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Partial<ChapterAtlasState>;
      out[k] = {
        catalogMapId: typeof o.catalogMapId === "string" || o.catalogMapId === null ? o.catalogMapId ?? null : null,
        customMapDataUrl: typeof o.customMapDataUrl === "string" || o.customMapDataUrl === null ? o.customMapDataUrl ?? null : null,
        people: o.people && typeof o.people === "object" ? (o.people as Record<string, ChapterMarkerPin>) : {},
        places: o.places && typeof o.places === "object" ? (o.places as Record<string, ChapterMarkerPin>) : {},
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveChapterAtlasMap(data: Record<string, ChapterAtlasState>): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!syncReady) return;
    const latest = loadChapterAtlasMap();
    void api.put("/library/chapter-atlas", { chapters: latest }).catch(() => {
      /* offline */
    });
  }, 900);
}

export function flushChapterAtlasSaveNow(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!syncReady) return;
  void api.put("/library/chapter-atlas", { chapters: loadChapterAtlasMap() }).catch(() => {
    /* offline */
  });
}

export async function hydrateChapterAtlasFromServer(): Promise<void> {
  try {
    const { data } = await api.get<{ chapters: Record<string, ChapterAtlasState> }>("/library/chapter-atlas");
    const remote = data?.chapters ?? {};
    if (Object.keys(remote).length > 0) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(remote));
      bumpWorkspaceEpoch();
      return;
    }
    const local = loadChapterAtlasMap();
    if (Object.keys(local).length > 0) {
      await api.put("/library/chapter-atlas", { chapters: local });
      bumpWorkspaceEpoch();
    }
  } catch {
    /* offline */
  } finally {
    syncReady = true;
  }
}

export function getMergedChapterState(book: string, chapter: number, fallbackCatalogId: string | null): ChapterAtlasState {
  const k = chapterAtlasKey(book, chapter);
  const map = loadChapterAtlasMap();
  const raw = map[k];
  const base = defaultChapterAtlasState(fallbackCatalogId);
  if (!raw) return base;
  return {
    catalogMapId: raw.catalogMapId ?? fallbackCatalogId,
    customMapDataUrl: raw.customMapDataUrl ?? null,
    people: { ...raw.people },
    places: { ...raw.places },
  };
}

function patchChapter(
  book: string,
  chapter: number,
  fallbackCatalogId: string | null,
  mut: (prev: ChapterAtlasState) => ChapterAtlasState,
): void {
  const k = chapterAtlasKey(book, chapter);
  const map = loadChapterAtlasMap();
  const prev = getMergedChapterState(book, chapter, fallbackCatalogId);
  map[k] = mut(prev);
  saveChapterAtlasMap(map);
  bumpWorkspaceEpoch();
}

export function setChapterCatalogAndCustom(
  book: string,
  chapter: number,
  fallbackCatalogId: string | null,
  patch: { catalogMapId?: string | null; customMapDataUrl?: string | null },
): void {
  patchChapter(book, chapter, fallbackCatalogId, (prev) => {
    const next = { ...prev, ...patch };
    if (patch.customMapDataUrl === undefined) {
      /* keep */
    } else if (patch.customMapDataUrl === null) {
      next.customMapDataUrl = null;
    } else {
      next.customMapDataUrl = patch.customMapDataUrl;
    }
    if (patch.catalogMapId !== undefined) next.catalogMapId = patch.catalogMapId;
    return next;
  });
}

export function upsertChapterMarker(
  book: string,
  chapter: number,
  fallbackCatalogId: string | null,
  kind: "person" | "place",
  id: string,
  pin: ChapterMarkerPin,
): void {
  patchChapter(book, chapter, fallbackCatalogId, (prev) => {
    const next = { ...prev };
    if (kind === "person") next.people = { ...next.people, [id]: pin };
    else next.places = { ...next.places, [id]: pin };
    return next;
  });
}

export function removeChapterMarker(
  book: string,
  chapter: number,
  fallbackCatalogId: string | null,
  kind: "person" | "place",
  id: string,
): void {
  patchChapter(book, chapter, fallbackCatalogId, (prev) => {
    const next = { ...prev, people: { ...prev.people }, places: { ...prev.places } };
    if (kind === "person") delete next.people[id];
    else delete next.places[id];
    return next;
  });
}

export function toggleChapterMarkerPinned(
  book: string,
  chapter: number,
  fallbackCatalogId: string | null,
  kind: "person" | "place",
  id: string,
): void {
  patchChapter(book, chapter, fallbackCatalogId, (prev) => {
    const next = { ...prev, people: { ...prev.people }, places: { ...prev.places } };
    const bucket = kind === "person" ? next.people : next.places;
    const cur = bucket[id];
    if (!cur) return prev;
    bucket[id] = { ...cur, pinned: !cur.pinned };
    return next;
  });
}
