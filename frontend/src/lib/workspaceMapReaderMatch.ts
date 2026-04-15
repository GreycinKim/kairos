import { mapForPassage } from "@/lib/mapForPassage";
import { getBookHistoricalContext } from "@/lib/bookHistoricalContext";
import type { WorkspaceMapCatalogEntry } from "@/lib/workspaceMapSections";

/** Default numbered plate (01–43) when a book has no explicit row — from suggested historical era. */
const ERA_FALLBACK_PLATE: number[] = [7, 8, 13, 21, 24, 27, 36, 37];

function plateFromEraFallback(book: string): number {
  const ctx = getBookHistoricalContext(book);
  const i = ctx?.suggestedMapEraIndex;
  if (i !== undefined && i >= 0 && i <= 7) return ERA_FALLBACK_PLATE[i] ?? 9;
  return 9;
}

export function catalogEntryForPlate(entries: WorkspaceMapCatalogEntry[], plate: number): WorkspaceMapCatalogEntry | undefined {
  const prefix = `${String(plate).padStart(2, "0")} `;
  return entries.find((e) => e.file.startsWith(prefix));
}

function entryByCatalogId(entries: WorkspaceMapCatalogEntry[], catalogId: string): WorkspaceMapCatalogEntry | undefined {
  return entries.find((e) => e.id === catalogId);
}

function entryBySrcFilename(entries: WorkspaceMapCatalogEntry[], src: string): WorkspaceMapCatalogEntry | undefined {
  const file = src.split("/").pop() ?? "";
  if (!file) return undefined;
  return entries.find((e) => e.file === file);
}

/**
 * Picks the best atlas plate for the reader sidebar using {@link mapForPassage}
 * and the synced workspace catalog.
 */
export function pickReaderWorkspaceMap(
  book: string,
  chapter: number,
  entries: WorkspaceMapCatalogEntry[],
  verse?: number,
): WorkspaceMapCatalogEntry | undefined {
  if (!entries.length) return undefined;
  const mp = mapForPassage(book, chapter, verse);
  const byId = entryByCatalogId(entries, mp.catalogId);
  if (byId) return byId;
  const byFile = entryBySrcFilename(entries, mp.src);
  if (byFile) return byFile;
  const fallbackPlate = plateFromEraFallback(book);
  return catalogEntryForPlate(entries, fallbackPlate) ?? entries.find((e) => /^\d{2}\s/.test(e.file));
}

/** @deprecated Prefer {@link pickReaderWorkspaceMap} with catalog + mapForPassage; kept for older callers. */
export function workspacePlateForReader(book: string, chapter: number): number {
  const mp = mapForPassage(book, chapter);
  const m = mp.catalogId.match(/^ws-(\d{2})-/);
  if (m) return parseInt(m[1]!, 10);
  return plateFromEraFallback(book);
}
