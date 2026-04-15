import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";

export type BiblePlaceTextChunk = { kind: "text"; text: string } | { kind: "place"; placeId: string; text: string };

type MatchEntry = { nameNorm: string; id: string };

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{M}\p{N}]/u.test(ch);
}

/** Longest-name-first index for greedy matching. */
export function buildBiblePlaceMatchList(locations: BibleMapLocationJson[]): MatchEntry[] {
  const rows: MatchEntry[] = [];
  for (const loc of locations) {
    const n = loc.name?.trim();
    if (!n) continue;
    rows.push({ nameNorm: normName(n), id: loc.id });
  }
  rows.sort((a, b) => b.nameNorm.length - a.nameNorm.length);
  return rows;
}

/**
 * Split plain text into runs of literal text vs recognized place names.
 * Uses word-boundary guards so short names (e.g. "Ur") do not match inside longer words.
 */
export function splitTextByBiblePlaceNames(input: string, sorted: MatchEntry[]): BiblePlaceTextChunk[] {
  if (!input) return [];
  const out: BiblePlaceTextChunk[] = [];
  let buf = "";
  let i = 0;
  const flush = () => {
    if (buf) {
      out.push({ kind: "text", text: buf });
      buf = "";
    }
  };
  while (i < input.length) {
    let matched: MatchEntry | null = null;
    const rest = input.slice(i);
    const restL = rest.toLowerCase();
    for (const cand of sorted) {
      if (!cand.nameNorm.length) continue;
      if (!restL.startsWith(cand.nameNorm)) continue;
      const end = i + cand.nameNorm.length;
      const prev = i > 0 ? input[i - 1]! : "";
      const next = end < input.length ? input[end]! : "";
      const prevOk = i === 0 || !isWordChar(prev);
      const nextOk = end >= input.length || !isWordChar(next);
      if (prevOk && nextOk) {
        matched = cand;
        break;
      }
    }
    if (matched) {
      flush();
      const len = matched.nameNorm.length;
      out.push({ kind: "place", placeId: matched.id, text: input.slice(i, i + len) });
      i += len;
    } else {
      buf += input[i]!;
      i += 1;
    }
  }
  flush();
  return out;
}
