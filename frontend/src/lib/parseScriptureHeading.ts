import { BIBLE_BOOK_TITLES } from "@/lib/bibleBookTitles";

export interface ParsedPassageRef {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  /** Raw text after # marks on the heading line */
  rawHeading: string;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let _bookRe: RegExp | null = null;

function bookMatchingRegex(): RegExp {
  if (_bookRe) return _bookRe;
  const alt = [...BIBLE_BOOK_TITLES].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
  _bookRe = new RegExp(`^(${alt})\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[–-]\\s*(\\d+))?\\s*$`, "i");
  return _bookRe;
}

/** Parse a single line like `John 3:16` or `Romans 8:28-30` (no #). */
export function parseScriptureHeadingLine(line: string): ParsedPassageRef | null {
  const t = line.trim();
  const m = t.match(bookMatchingRegex());
  if (!m) return null;
  const bookRaw = m[1]!;
  const chapter = parseInt(m[2]!, 10);
  const verseStart = parseInt(m[3]!, 10);
  const verseEnd = m[4] ? parseInt(m[4], 10) : null;
  const book =
    BIBLE_BOOK_TITLES.find((b) => b.toLowerCase() === bookRaw.toLowerCase()) ?? bookRaw;
  if (Number.isNaN(chapter) || Number.isNaN(verseStart)) return null;
  if (verseEnd !== null && Number.isNaN(verseEnd)) return null;
  const ve = verseEnd !== null && verseEnd >= verseStart ? verseEnd : null;
  return { book, chapter, verseStart, verseEnd: ve, rawHeading: t };
}

const HEADING_LINE = /^#{1,3}\s+(.+)$/;

/** All `##` / `###` / `#` lines that look like scripture refs, in document order. */
export function extractPassagesFromMarkdown(md: string): ParsedPassageRef[] {
  const out: ParsedPassageRef[] = [];
  for (const line of md.split(/\r?\n/)) {
    const hm = line.match(HEADING_LINE);
    if (!hm) continue;
    const parsed = parseScriptureHeadingLine(hm[1] ?? "");
    if (parsed) out.push(parsed);
  }
  return out;
}

export function passageNodeId(r: Pick<ParsedPassageRef, "book" | "chapter" | "verseStart" | "verseEnd">): string {
  const end = r.verseEnd ?? r.verseStart;
  return `ref:${r.book}:${r.chapter}:${r.verseStart}:${end}`;
}

export function formatPassageLabel(r: Pick<ParsedPassageRef, "book" | "chapter" | "verseStart" | "verseEnd">): string {
  if (r.verseEnd !== null && r.verseEnd !== r.verseStart) {
    return `${r.book} ${r.chapter}:${r.verseStart}–${r.verseEnd}`;
  }
  return `${r.book} ${r.chapter}:${r.verseStart}`;
}

export function markdownHasPassage(md: string, r: Pick<ParsedPassageRef, "book" | "chapter" | "verseStart" | "verseEnd">): boolean {
  const id = passageNodeId(r);
  return extractPassagesFromMarkdown(md).some((p) => passageNodeId(p) === id);
}
