import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Link2,
  Map as MapIcon,
  Maximize2,
  Mic2,
  Search,
  SquarePen,
  X,
} from "lucide-react";

import { api } from "@/api/client";
import { LayoutResizeHandle } from "@/components/layout/LayoutResizeHandle";
import { ReaderBibleMapPanel } from "@/components/reader/ReaderBibleMapPanel";
import { ReaderPlaceMapPanel } from "@/components/reader/ReaderPlaceMapPanel";
import { ReaderSermonMapPanel } from "@/components/reader/ReaderSermonMapPanel";
import { ChapterCastModal } from "@/components/reader/ChapterCastModal";
import { VerseInteractiveChapter } from "@/components/reader/VerseInteractiveChapter";
import { PersonLoreModal } from "@/components/timeline/PersonLoreModal";
import { BibleVersionSelect } from "@/components/scripture/BibleVersionSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProfilesInChapter } from "@/lib/chapterCastMembers";
import { chapterCountFor } from "@/lib/bibleCanon";
import { parseBibleVersion, type BibleVersionId } from "@/lib/bibleVersions";
import { GOSPEL_META, PARALLEL_GOSPEL_SECTIONS, type GospelKey } from "@/lib/parallelGospelsData";
import { getReaderBookOutline } from "@/lib/readerBookOutlines";
import { loadPeopleProfiles, type PersonProfile } from "@/lib/timelinePeople";
import type {
  ChapterTextResponse,
  FlowMapChapterIndexResponse,
  FlowMapVerseRollup,
  JbchHubRead,
  JbchRecitationCard,
  TimelineEvent,
} from "@/types";
import { useTimelineStore } from "@/store/timelineStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import clsx from "clsx";
import { Panel, PanelGroup } from "react-resizable-panels";

type HubTab = "index" | "dictionary" | "recitation";
type ReaderSubTab = "outline" | "text" | "sermon";

const JBCH_ORANGE = "#ff8c00";
const GOSPELS: GospelKey[] = ["matthew", "mark", "luke", "john"];

function uniqueMapOptionsFromRollup(r: FlowMapVerseRollup): { id: string; title: string }[] {
  const m = new Map<string, string>();
  const put = (id: string | undefined | null, title: string) => {
    const sid = typeof id === "string" ? id.trim() : "";
    if (!sid) return;
    m.set(sid, title);
  };
  for (const x of r.in_maps) put(x.map_id, x.map_title);
  for (const x of r.leads_to) put(x.map_id, x.map_title);
  for (const x of r.led_from) put(x.map_id, x.map_title);
  return [...m.entries()].map(([id, title]) => ({ id, title }));
}

function defaultMapIdFromRollup(r: FlowMapVerseRollup): string | null {
  return uniqueMapOptionsFromRollup(r)[0]?.id ?? null;
}
const crossRefChapterCache = new globalThis.Map<string, ChapterTextResponse>();

function gospelKeyForBook(book: string): GospelKey | null {
  const b = book.trim().toLowerCase();
  if (b === "matthew") return "matthew";
  if (b === "mark") return "mark";
  if (b === "luke") return "luke";
  if (b === "john") return "john";
  return null;
}

function refTouchesChapter(ref: string | null, chapter: number): boolean {
  if (!ref) return false;
  const m = ref.match(/\s(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?/);
  if (!m) return false;
  const startChapter = Number(m[1]);
  const endChapter = m[3] ? Number(m[3]) : startChapter;
  return chapter >= startChapter && chapter <= endChapter;
}

function parsePassageRef(ref: string): {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  chapterSegments: Record<number, Array<{ start: number; end: number }>>;
} | null {
  const m = ref.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?(?:,\s*(.+))?$/);
  if (!m) return null;
  const book = (m[1] ?? "").trim();
  if (!book) return null;
  const chapterStart = Number(m[2]);
  const verseStart = Number(m[3]);
  const endChapterRaw = m[4];
  const endVerseRaw = m[5];
  const tail = m[6];
  const chapterEnd = endVerseRaw ? Number(endChapterRaw ?? chapterStart) : chapterStart;
  const endVerse = Number(endVerseRaw ?? verseStart);
  const chapterSegments: Record<number, Array<{ start: number; end: number }>> = {
    [chapterStart]: [{ start: verseStart, end: chapterStart === chapterEnd ? endVerse : 999 }],
  };
  if (chapterEnd > chapterStart) {
    for (let c = chapterStart + 1; c <= chapterEnd; c += 1) {
      chapterSegments[c] = [{ start: 1, end: c === chapterEnd ? endVerse : 999 }];
    }
  }
  if (tail && chapterEnd === chapterStart) {
    const extras = tail
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((part) => {
        const r = part.match(/^(\d+)(?:-(\d+))?$/);
        if (!r) return null;
        const s = Number(r[1]);
        const e = Number(r[2] ?? r[1]);
        return { start: s, end: e };
      })
      .filter((x): x is { start: number; end: number } => Boolean(x));
    if (extras.length) chapterSegments[chapterStart] = [...(chapterSegments[chapterStart] ?? []), ...extras];
  }
  return { book, chapterStart, chapterEnd, chapterSegments };
}

function resolveBookName(raw: string, books: string[]): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return null;
  const low = t.toLowerCase();
  const exact = books.find((b) => b.toLowerCase() === low);
  if (exact) return exact;
  const compact = low.replace(/\s+/g, "");
  const compactMatch = books.find((b) => b.toLowerCase().replace(/\s+/g, "") === compact);
  if (compactMatch) return compactMatch;
  const starts = books.filter((b) => b.toLowerCase().startsWith(low));
  if (starts.length === 1) return starts[0] ?? null;
  return null;
}

/** Book + chapter, or book + chapter + verse/range (first verse for scroll). Names must match hub book list. */
function parseReaderGoQuery(
  raw: string,
  books: string[],
): { book: string; chapter: number; verse?: number } | null {
  const s = raw.trim();
  if (!s) return null;
  const pr = parsePassageRef(s);
  if (pr) {
    const bk = resolveBookName(pr.book, books);
    if (!bk) return null;
    const max = chapterCountFor(bk);
    const ch = Math.min(Math.max(1, pr.chapterStart), max);
    const seg = pr.chapterSegments[ch]?.[0];
    const vs = seg?.start;
    return {
      book: bk,
      chapter: ch,
      verse: vs !== undefined && Number.isFinite(vs) && vs >= 1 ? vs : undefined,
    };
  }
  const m2 = s.match(/^([1-3]?\s?[A-Za-z]+)\s+(\d+)\s*$/);
  if (m2) {
    const bk = resolveBookName((m2[1] ?? "").trim(), books);
    if (!bk) return null;
    const chNum = Number(m2[2]);
    if (!Number.isFinite(chNum) || chNum < 1) return null;
    const max = chapterCountFor(bk);
    return { book: bk, chapter: Math.min(chNum, max) };
  }
  return null;
}

function CrossRefPassage({ refText }: { refText: string }) {
  const [text, setText] = useState("Loading passage...");
  useEffect(() => {
    let live = true;
    const parsed = parsePassageRef(refText);
    if (!parsed) {
      setText(refText);
      return () => {
        live = false;
      };
    }
    const load = async () => {
      try {
        const chunks: string[] = [];
        for (let ch = parsed.chapterStart; ch <= parsed.chapterEnd; ch += 1) {
          const cacheKey = `${parsed.book}-${ch}-KJV`;
          let data = crossRefChapterCache.get(cacheKey);
          if (!data) {
            const res = await api.get<ChapterTextResponse>("/scripture/chapter", {
              params: { book: parsed.book, chapter: ch, translation: "KJV" },
            });
            data = res.data;
            crossRefChapterCache.set(cacheKey, data);
          }
          const segs = parsed.chapterSegments[ch] ?? [{ start: 1, end: 999 }];
          if (!data) continue;
          const rows = data.verses.filter((v: ChapterTextResponse["verses"][number]) => segs.some((s) => v.verse >= s.start && v.verse <= s.end));
          if (rows.length) chunks.push(rows.map((v) => `${v.verse}. ${v.text}`).join(" "));
        }
        if (live) setText(chunks.join(" "));
      } catch {
        if (live) setText("Could not load this cross-reference passage.");
      }
    };
    void load();
    return () => {
      live = false;
    };
  }, [refText]);
  return <p className="mt-1 text-xs leading-relaxed text-neutral-700">{text}</p>;
}

/** Per-gospel passage: closed <details> by default; loads verse text after first open. */
function GospelPassageDetails({ label, refText }: { label: string; refText: string }) {
  const [passageReady, setPassageReady] = useState(false);
  return (
    <details
      className="rounded-lg border border-neutral-200 bg-white [&_summary::-webkit-details-marker]:hidden"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) setPassageReady(true);
      }}
    >
      <summary className="cursor-pointer list-none px-2 py-1.5 text-left text-[11px] font-medium text-neutral-800 marker:content-none hover:bg-neutral-50">
        <span className="text-neutral-900">{label}:</span>{" "}
        <span className="font-normal text-neutral-600">{refText}</span>
      </summary>
      <div className="border-t border-neutral-100 px-2 pb-2 pt-1">
        {passageReady ? <CrossRefPassage refText={refText} /> : null}
      </div>
    </details>
  );
}

function OutlineTabPanel({ book }: { book: string }) {
  const outline = getReaderBookOutline(book);

  const renderList = (title: string, items?: string[]) => {
    if (!items?.length) return null;
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold tracking-wide text-neutral-900">{title}</h3>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-neutral-700">
          {items.map((item) => (
            <li key={`${title}-${item}`} className="list-disc pl-1 ml-5">
              {item}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  if (!outline) {
    return (
      <div className="mx-auto mt-12 w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600 shadow-sm">
        No outline data is stored yet for <span className="font-semibold text-neutral-900">{book}</span>.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 text-left">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">{outline.title}</h2>
        {(outline.dateLabel || outline.teacher) && (
          <p className="mt-1 text-sm text-neutral-600">
            {[outline.dateLabel, outline.teacher].filter(Boolean).join(" - ")}
          </p>
        )}
      </section>
      {renderList("Etymology", outline.etymology)}
      {renderList("Author", outline.author)}
      {renderList("Date of Writing", outline.dateOfWriting)}
      {renderList("Historical Background", outline.historicalBackground)}
      {renderList("Thematic Outline", outline.thematicOutline)}
      {renderList("Key References", outline.keyReferences)}
    </div>
  );
}

function CrossRefsTabPanel({
  book,
  chapter,
  embedded,
}: {
  book: string;
  chapter: number;
  /** Side pane next to main reader: tighter layout, no duplicate hero card. */
  embedded?: boolean;
}) {
  const gospelKey = gospelKeyForBook(book);
  const parallels = useMemo(() => {
    if (!gospelKey) return [];
    return PARALLEL_GOSPEL_SECTIONS.filter((s) => refTouchesChapter(s.refs[gospelKey], chapter)).map((s) => ({
      id: s.id,
      title: s.title,
      group: s.group,
      mine: s.refs[gospelKey],
      others: GOSPELS.filter((k) => k !== gospelKey)
        .map((k) => ({ key: k, ref: s.refs[k] }))
        .filter((x) => Boolean(x.ref)),
    }));
  }, [gospelKey, chapter]);

  const parallelsBlock = gospelKey ? (
    <div className={embedded ? "rounded-xl border border-neutral-200 bg-white p-3" : "mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3"}>
      <h3 className="text-sm font-semibold text-neutral-900">Parallel events in this chapter</h3>
      {parallels.length ? (
        <div className="mt-2 space-y-2">
          {parallels.map((p) => (
            <div key={`parallel-${p.id}`} className="rounded-lg border border-neutral-200 bg-white p-2.5">
              <p className="text-xs font-semibold text-neutral-900">
                {p.id}. {p.title}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">{p.group}</p>
              <div className="mt-2 space-y-1.5">
                {p.mine ? (
                  <GospelPassageDetails label={GOSPEL_META[gospelKey].label} refText={p.mine} />
                ) : null}
                {p.others.length ? (
                  p.others.map((o) =>
                    o.ref ? (
                      <GospelPassageDetails key={`${p.id}-${o.key}`} label={GOSPEL_META[o.key].label} refText={o.ref} />
                    ) : null,
                  )
                ) : (
                  <p className="text-[11px] italic text-neutral-500">No cross-reference in other Gospels for this harmony event.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-600">No harmony cross-references tagged for this chapter yet.</p>
      )}
    </div>
  ) : (
    <p className={embedded ? "text-sm text-neutral-600" : "mt-3 text-sm text-neutral-600"}>
      Cross-reference reader is currently available for Matthew, Mark, Luke, and John.
    </p>
  );

  if (embedded) {
    return <div className="w-full min-w-0 text-left">{parallelsBlock}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl text-left xl:max-w-5xl">
      <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Clock className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-neutral-900">Cross-reference reader</h2>
          <p className="mt-1 text-sm text-neutral-500">
            You are reading <span className="font-medium text-neutral-800">{book}</span> {chapter}.
          </p>
          {parallelsBlock}
        </div>
      </div>
    </div>
  );
}

function formatApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the Kairos API. Start the backend (uvicorn on port 8000) so /api is available from this dev server.";
    }
    const st = err.response?.status;
    if (st === 404) {
      const raw = err.response?.data;
      const detail =
        typeof raw === "object" && raw && "detail" in raw
          ? String((raw as { detail: unknown }).detail)
          : typeof raw === "string"
            ? raw
            : "";
      if (!detail || detail === "Not Found") {
        return `${fallback} No API route matched (404). From localhost the app calls http://127.0.0.1:8000/api — start uvicorn on port 8000. From another host, set VITE_API_BASE_URL at build time and reverse-proxy /api to FastAPI.`;
      }
    }
    const d = err.response?.data;
    if (typeof d === "object" && d && "detail" in d) {
      const det = (d as { detail: unknown }).detail;
      if (typeof det === "string") return det;
      if (Array.isArray(det))
        return det
          .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: string }).msg) : String(x)))
          .join("; ");
    }
    if (err.response?.status) return `${fallback} (HTTP ${err.response.status})`;
  }
  return fallback;
}

function RecitationPractice({ card }: { card: JbchRecitationCard }) {
  const tokens = useMemo(() => card.text.split(/(\s+)/).filter(Boolean), [card.text]);
  const [hidden, setHidden] = useState<Set<number>>(() => {
    const next = new Set<number>();
    tokens.forEach((tok, i) => {
      if (/^\s+$/.test(tok)) return;
      if (Math.random() < 0.28) next.add(i);
    });
    return next;
  });

  const reveal = (i: number) => {
    setHidden((prev) => {
      const n = new Set(prev);
      n.delete(i);
      return n;
    });
  };

  const reshuffle = () => {
    const next = new Set<number>();
    tokens.forEach((tok, i) => {
      if (/^\s+$/.test(tok)) return;
      if (Math.random() < 0.28) next.add(i);
    });
    setHidden(next);
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{card.reference}</p>
          <h3 className="text-sm font-semibold text-neutral-900">{card.title}</h3>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={reshuffle}>
          Shuffle blanks
        </Button>
      </div>
      <p className="mt-3 text-xs text-neutral-500">Tap a blank to reveal that word.</p>
      <p className="mt-4 font-serif text-[15px] leading-relaxed text-neutral-800">
        {tokens.map((tok, i) => {
          if (/^\s+$/.test(tok)) {
            return <span key={i}>{tok}</span>;
          }
          if (hidden.has(i)) {
            const mask = "·".repeat(Math.min(10, Math.max(3, Math.ceil(tok.length / 2))));
            return (
              <button
                key={i}
                type="button"
                onClick={() => reveal(i)}
                className="mx-0.5 inline-block min-w-[2rem] rounded border border-dashed px-1.5 py-0.5 align-baseline font-mono text-xs tracking-widest hover:opacity-80"
                style={{ borderColor: JBCH_ORANGE, color: JBCH_ORANGE }}
                aria-label="Reveal word"
              >
                {mask}
              </button>
            );
          }
          return (
            <span key={i} className="mx-0.5">
              {tok}
            </span>
          );
        })}
      </p>
    </div>
  );
}

export function JbchHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as HubTab) || "index";
  const bookParam = searchParams.get("book") || "Genesis";
  const chapterParam = Math.max(1, parseInt(searchParams.get("chapter") || "1", 10) || 1);
  const verseParamRaw = searchParams.get("verse");
  const verseParam =
    verseParamRaw != null && /^\d+$/.test(verseParamRaw) ? Math.max(1, parseInt(verseParamRaw, 10)) : null;
  const translationParam = parseBibleVersion(searchParams.get("translation"));

  const setBookChapter = (b: string, ch: number, verseOptional?: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("book", b);
    next.set("chapter", String(ch));
    if (verseOptional != null && Number.isFinite(verseOptional) && verseOptional >= 1) {
      next.set("verse", String(Math.floor(verseOptional)));
    } else {
      next.delete("verse");
    }
    setSearchParams(next, { replace: true });
  };

  const setTranslation = (t: BibleVersionId) => {
    const next = new URLSearchParams(searchParams);
    next.set("translation", t);
    setSearchParams(next, { replace: true });
  };

  const [data, setData] = useState<JbchHubRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get<JbchHubRead>("/jbch-hub");
      setData(d);
    } catch (e) {
      setError(formatApiError(e, "Could not load reader hub."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
      {loading || !data ? (
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Loading mirror…</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {tab === "index" ? (
            <IndexExperience
              slice={data.index}
              book={bookParam}
              chapter={chapterParam}
              verseFromUrl={verseParam}
              translation={translationParam}
              onTranslationChange={setTranslation}
              onBookChapter={setBookChapter}
              error={error}
            />
          ) : null}
          {tab === "dictionary" ? <DictionaryExperience slice={data.dictionary} error={error} /> : null}
          {tab === "recitation" ? <RecitationExperience page={data.recitation_page} cards={data.recitation_cards} error={error} /> : null}
        </div>
      )}
    </div>
  );
}

function IndexExperience({
  slice,
  book,
  chapter,
  verseFromUrl,
  translation,
  onTranslationChange,
  onBookChapter,
  error,
}: {
  slice: JbchHubRead["index"];
  book: string;
  chapter: number;
  verseFromUrl: number | null;
  translation: BibleVersionId;
  onTranslationChange: (t: BibleVersionId) => void;
  onBookChapter: (book: string, chapter: number, verse?: number) => void;
  error: string | null;
}) {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const books = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of slice.links) {
      const n = l.text.trim();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      out.push(n);
    }
    return out;
  }, [slice.links]);

  const [locationQuery, setLocationQuery] = useState("");
  const [bookSearchFocused, setBookSearchFocused] = useState(false);
  const [bookMatchActive, setBookMatchActive] = useState(0);
  const bookSearchInputRef = useRef<HTMLInputElement>(null);
  const [chapterCastOpen, setChapterCastOpen] = useState(false);
  const [readerLore, setReaderLore] = useState<{ event: TimelineEvent; profile: PersonProfile } | null>(null);
  const fetchTimelineEvents = useTimelineStore((s) => s.fetchEvents);
  const timelineEvents = useTimelineStore((s) => s.events);
  const [subTab, setSubTab] = useState<ReaderSubTab>("text");
  const [fontPx, setFontPx] = useState(17);
  const [chapterData, setChapterData] = useState<ChapterTextResponse | null>(null);
  const [chLoading, setChLoading] = useState(false);
  const [chError, setChError] = useState<string | null>(null);
  const MAP_VISIBLE_LS = "kairos_reader_map_visible";
  const [mapPanelOpen, setMapPanelOpen] = useState(() => {
    try {
      const v = localStorage.getItem(MAP_VISIBLE_LS);
      if (v === "0") return false;
      if (v === "1") return true;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MAP_VISIBLE_LS, mapPanelOpen ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [mapPanelOpen]);

  const readerScrollRef = useRef<HTMLDivElement>(null);
  const [scrollFocusVerse, setScrollFocusVerse] = useState<number | null>(null);
  const verseMapDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDominantVisibleVerse = useCallback((v: number) => {
    if (verseMapDebounce.current) clearTimeout(verseMapDebounce.current);
    verseMapDebounce.current = setTimeout(() => setScrollFocusVerse(v), 140);
  }, []);

  useEffect(() => {
    setScrollFocusVerse(null);
  }, [book, chapter]);

  const [crossRefPanelOpen, setCrossRefPanelOpen] = useState(() => {
    try {
      return sessionStorage.getItem("jbch_reader_crossref_open") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("jbch_reader_crossref_open", crossRefPanelOpen ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [crossRefPanelOpen]);

  useEffect(() => {
    void fetchTimelineEvents();
  }, [fetchTimelineEvents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChLoading(true);
      setChError(null);
      try {
        const { data } = await api.get<ChapterTextResponse>("/scripture/chapter", {
          params: { book, chapter, translation },
        });
        if (!cancelled) setChapterData(data);
      } catch (e) {
        if (!cancelled) {
          setChapterData(null);
          setChError(formatApiError(e, "Could not load this chapter."));
        }
      } finally {
        if (!cancelled) setChLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book, chapter, translation]);

  const [flowMapChapter, setFlowMapChapter] = useState<FlowMapChapterIndexResponse | null>(null);

  useEffect(() => {
    if (subTab !== "text") {
      setFlowMapChapter(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<FlowMapChapterIndexResponse>("/scripture/flow-maps/chapter-index", {
          params: { book, chapter },
        });
        if (!cancelled) setFlowMapChapter(data);
      } catch {
        if (!cancelled) setFlowMapChapter(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book, chapter, subTab]);

  const [sermonReaderPanel, setSermonReaderPanel] = useState<{
    mapId: string;
    verse: number;
    rollup: FlowMapVerseRollup;
  } | null>(null);

  const handleToggleSermonMapForVerse = useCallback((verse: number, rollup: FlowMapVerseRollup) => {
    const id = defaultMapIdFromRollup(rollup);
    if (!id) return;
    setSermonReaderPanel((prev) => {
      if (prev && prev.verse === verse) return null;
      return { mapId: id, verse, rollup };
    });
  }, []);

  useEffect(() => {
    setSermonReaderPanel(null);
  }, [book, chapter, subTab]);

  useEffect(() => {
    if (verseFromUrl == null || subTab !== "text" || chLoading || !chapterData?.verses.length) return;
    if (!chapterData.verses.some((v) => v.verse === verseFromUrl)) return;
    const id = requestAnimationFrame(() => {
      document.getElementById(`kairos-verse-${verseFromUrl}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [verseFromUrl, subTab, chLoading, book, chapter, chapterData]);

  const maxCh = chapterCountFor(book);
  const bookMatches = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return [];
    return books.filter((b) => b.toLowerCase().includes(q));
  }, [books, locationQuery]);

  const parsedLocationPreview = useMemo(
    () => parseReaderGoQuery(locationQuery.trim(), books),
    [locationQuery, books],
  );

  const showBookMatchMenu =
    bookSearchFocused &&
    locationQuery.trim().length > 0 &&
    bookMatches.length > 0 &&
    !parsedLocationPreview;

  useEffect(() => {
    setBookMatchActive(0);
  }, [locationQuery, bookMatches.length]);

  const applyLocationGo = useCallback(() => {
    const parsed = parseReaderGoQuery(locationQuery.trim(), books);
    if (!parsed) return false;
    onBookChapter(parsed.book, parsed.chapter, parsed.verse);
    setLocationQuery("");
    setBookMatchActive(0);
    setBookSearchFocused(false);
    bookSearchInputRef.current?.blur();
    return true;
  }, [locationQuery, books, onBookChapter]);

  const pickBookFromSearch = useCallback(
    (b: string) => {
      onBookChapter(b, 1);
      setLocationQuery("");
      setBookMatchActive(0);
      setBookSearchFocused(false);
      bookSearchInputRef.current?.blur();
    },
    [onBookChapter],
  );

  const nextChapter = () => {
    if (chapter >= maxCh) return;
    onBookChapter(book, chapter + 1);
  };
  const prevChapter = () => {
    if (chapter <= 1) return;
    onBookChapter(book, chapter - 1);
  };

  const lgUp = useMediaQuery("(min-width: 1024px)");

  const chapterCastRows = useMemo(
    () => listProfilesInChapter(timelineEvents, loadPeopleProfiles(), book, chapter),
    [timelineEvents, book, chapter, workspaceEpoch],
  );

  const passageVerseForMap = scrollFocusVerse ?? verseFromUrl ?? undefined;

  const readerScrollContent = (
    <>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <div className="mx-auto w-full max-w-3xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-none 2xl:max-w-[min(96rem,100%)]">
        {subTab === "text" ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {book} {chapter}
              </h1>
              <p className="mt-1 text-sm font-medium" style={{ color: JBCH_ORANGE }}>
                {chapterData?.translation ?? translation} · Chapter {chapter}
              </p>
            </div>

            {chLoading ? <p className="mt-10 text-center text-sm text-neutral-500">Loading chapter…</p> : null}
            {chError ? <p className="mt-10 text-center text-sm text-red-600">{chError}</p> : null}

            {!chLoading && chapterData?.verses.length ? (
              <VerseInteractiveChapter
                book={book}
                chapter={chapter}
                translation={translation}
                verses={chapterData.verses}
                fontPx={fontPx}
                flowMapByVerse={flowMapChapter?.verses}
                onToggleSermonMapForVerse={handleToggleSermonMapForVerse}
                scrollRootRef={readerScrollRef}
                onDominantVisibleVerse={onDominantVisibleVerse}
              />
            ) : null}
          </>
        ) : subTab === "outline" ? (
          <OutlineTabPanel book={book} />
        ) : (
          <div className="mx-auto mt-16 w-full max-w-2xl text-center text-sm text-neutral-500 xl:max-w-5xl">
            Sermon notes placeholder.
          </div>
        )}
      </div>
    </>
  );

  const readerScrollAreaClass =
    "relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-24 sm:px-6 lg:px-10 xl:px-12";

  const readerFabStack = (
    <div className="pointer-events-none absolute bottom-6 right-6 flex flex-col items-center gap-2">
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-full border border-neutral-200 bg-white shadow-lg">
        <button
          type="button"
          className="px-3 py-2 text-lg font-medium text-neutral-700 hover:bg-neutral-50"
          onClick={() => setFontPx((x) => Math.min(24, x + 1))}
        >
          +
        </button>
        <button
          type="button"
          className="border-t border-neutral-100 px-3 py-2 text-lg font-medium text-neutral-700 hover:bg-neutral-50"
          onClick={() => setFontPx((x) => Math.max(13, x - 1))}
        >
          −
        </button>
      </div>
      <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          onClick={prevChapter}
          disabled={chapter <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-lg hover:bg-neutral-50 disabled:opacity-40"
          aria-label="Previous chapter"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={nextChapter}
          disabled={chapter >= maxCh}
          className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: JBCH_ORANGE }}
          aria-label="Next chapter"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );

  const readerColumn = (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-4 py-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-neutral-600">
            <span className="shrink-0 text-sm font-semibold text-neutral-900">Reader</span>
            <div className="relative min-w-0 flex-[1_1_10rem] max-w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                ref={bookSearchInputRef}
                id="jbch-location-search"
                role="combobox"
                aria-expanded={showBookMatchMenu}
                aria-controls="jbch-book-search-listbox"
                aria-autocomplete="list"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setBookSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setBookSearchFocused(false), 120);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (applyLocationGo()) {
                      e.preventDefault();
                      return;
                    }
                    if (showBookMatchMenu && bookMatches.length) {
                      e.preventDefault();
                      const b = bookMatches[bookMatchActive];
                      if (b) pickBookFromSearch(b);
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setLocationQuery("");
                    setBookSearchFocused(false);
                    (e.target as HTMLInputElement).blur();
                    return;
                  }
                  if (!showBookMatchMenu || !bookMatches.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setBookMatchActive((i) => Math.min(bookMatches.length - 1, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setBookMatchActive((i) => Math.max(0, i - 1));
                  }
                }}
                placeholder={
                  verseFromUrl != null ? `${book} ${chapter}:${verseFromUrl}` : `${book} ${chapter}`
                }
                className="h-9 border-neutral-200 bg-neutral-50 pl-9 pr-9 text-sm"
                autoComplete="off"
              />
              {locationQuery ? (
                <button
                  type="button"
                  aria-label="Clear"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => {
                    setLocationQuery("");
                    bookSearchInputRef.current?.focus();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
              {showBookMatchMenu ? (
                <div
                  id="jbch-book-search-listbox"
                  role="listbox"
                  aria-label="Matching books"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(50vh,280px)] overflow-y-auto overscroll-contain rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                >
                  {bookMatches.map((b, i) => {
                    const ch = chapterCountFor(b);
                    const active = book === b;
                    const keyboardActive = i === bookMatchActive;
                    return (
                      <button
                        key={b}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => pickBookFromSearch(b)}
                        onMouseEnter={() => setBookMatchActive(i)}
                        className={clsx(
                          "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                          active && "font-semibold text-white",
                          !active && keyboardActive && "bg-neutral-100",
                          !active && !keyboardActive && "hover:bg-neutral-50",
                        )}
                        style={active ? { backgroundColor: JBCH_ORANGE } : undefined}
                      >
                        <span className={clsx("min-w-0 truncate", active ? "text-white" : "text-neutral-900")}>{b}</span>
                        <span className={clsx("shrink-0 text-xs", active ? "text-white/90" : "text-neutral-400")}>{ch} ch</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="shrink-0">
              <BibleVersionSelect value={translation} onChange={onTranslationChange} size="sm" className="border-neutral-200" />
            </div>
            {subTab === "text" ? (
              <div
                className="flex min-w-0 max-w-[min(360px,48vw)] shrink-0 items-center justify-end gap-2"
                title="People, places, and timeline events tagged to this chapter"
              >
                {chapterCastRows.length > 0 ? (
                  <div className="flex min-w-0 items-center pl-1">
                    {chapterCastRows.slice(0, 7).map(({ event: ev, profile: prof }, i) => (
                      <button
                        key={ev.id}
                        type="button"
                        className={clsx(
                          "relative z-[1] h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-neutral-100 shadow-sm outline-none ring-offset-2 transition hover:z-10 hover:ring-2 hover:ring-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400",
                          i > 0 && "-ml-2",
                        )}
                        aria-label={`Open lore: ${prof.name || ev.title}`}
                        onClick={() => setReaderLore({ event: ev, profile: prof })}
                      >
                        {prof.imageDataUrl ? (
                          <img src={prof.imageDataUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-sm text-neutral-600">{ev.icon ?? "👤"}</span>
                        )}
                      </button>
                    ))}
                    {chapterCastRows.length > 7 ? (
                      <button
                        type="button"
                        className="-ml-2 flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-neutral-200 px-1.5 text-[10px] font-semibold text-neutral-800 shadow-sm hover:bg-neutral-300"
                        title="Show full list"
                        onClick={() => setChapterCastOpen(true)}
                      >
                        +{chapterCastRows.length - 7}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
                  onClick={() => setChapterCastOpen(true)}
                >
                  This chapter
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-neutral-500">
            <Button type="button" variant="ghost" size="sm" asChild className="h-8 px-2 text-[11px]">
              <Link to="/reader/parallel-gospels">Parallel</Link>
            </Button>
            <button type="button" className="rounded-lg p-2 hover:bg-neutral-100" aria-label="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg p-2 hover:bg-neutral-100" aria-label="Edit">
              <SquarePen className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-lg p-2 hover:bg-neutral-100",
                crossRefPanelOpen && "bg-neutral-200 text-neutral-800",
              )}
              aria-label={crossRefPanelOpen ? "Hide cross-reference reader" : "Show cross-reference reader"}
              aria-pressed={crossRefPanelOpen}
              onClick={() => setCrossRefPanelOpen((o) => !o)}
            >
              <Link2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-lg p-2 hover:bg-neutral-100",
                mapPanelOpen && "bg-neutral-200 text-neutral-800",
              )}
              aria-label={mapPanelOpen ? "Hide map panel" : "Show map panel"}
              aria-pressed={mapPanelOpen}
              onClick={() => setMapPanelOpen((o) => !o)}
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex shrink-0 justify-end border-b border-neutral-100 px-4 py-2">
          <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
            {(
              [
                ["outline", "Outline"],
                ["text", "Text"],
                ["sermon", "Sermon"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubTab(id)}
                className={clsx(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  subTab === id ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {lgUp && (crossRefPanelOpen || sermonReaderPanel) ? (
          <PanelGroup
            direction="horizontal"
            autoSaveId="kairos-jbch-reader-text-sermon-split"
            className="relative flex min-h-0 min-w-0 flex-1"
          >
            <Panel
              id="jbch-reader-text"
              defaultSize={crossRefPanelOpen && sermonReaderPanel ? 52 : 58}
              minSize={30}
              className="relative flex min-h-0 min-w-0 flex-col"
            >
              <div ref={readerScrollRef} className={readerScrollAreaClass}>
                {readerScrollContent}
              </div>
              {readerFabStack}
            </Panel>
            <LayoutResizeHandle className="bg-neutral-200" />
            <Panel
              id="jbch-reader-right-stack"
              defaultSize={crossRefPanelOpen && sermonReaderPanel ? 48 : 42}
              minSize={22}
              className="flex min-h-0 min-w-0 flex-col border-l border-neutral-200 bg-neutral-50/80"
            >
              {crossRefPanelOpen ? (
                <div
                  className={clsx(
                    "flex min-h-0 flex-col",
                    sermonReaderPanel ? "max-h-[44%] shrink-0 border-b border-neutral-200" : "min-h-0 flex-1",
                  )}
                >
                  <div className="shrink-0 border-b border-neutral-200 bg-white/95 px-3 py-2">
                    <h2 className="text-sm font-semibold text-neutral-900">Cross references</h2>
                    <p className="text-[11px] text-neutral-500">
                      {book} {chapter}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                    <CrossRefsTabPanel book={book} chapter={chapter} embedded />
                  </div>
                </div>
              ) : null}
              {sermonReaderPanel ? (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <ReaderSermonMapPanel
                    mapId={sermonReaderPanel.mapId}
                    mapOptions={uniqueMapOptionsFromRollup(sermonReaderPanel.rollup)}
                    onMapIdChange={(id) => setSermonReaderPanel((p) => (p ? { ...p, mapId: id } : null))}
                    contextVerse={sermonReaderPanel.verse}
                    contextRollup={sermonReaderPanel.rollup}
                    onClose={() => setSermonReaderPanel(null)}
                  />
                </div>
              ) : null}
            </Panel>
          </PanelGroup>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div ref={readerScrollRef} className={readerScrollAreaClass}>
              {readerScrollContent}
            </div>
            {readerFabStack}
          </div>
        )}

        {crossRefPanelOpen && !lgUp ? (
          <div
            className="fixed inset-0 z-[45] flex flex-col bg-white lg:hidden"
            role="dialog"
            aria-label="Cross references"
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Cross references</h2>
                <p className="text-[11px] text-neutral-500">
                  {book} {chapter}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="Close cross references"
                onClick={() => setCrossRefPanelOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <CrossRefsTabPanel book={book} chapter={chapter} embedded />
            </div>
          </div>
        ) : null}

        {sermonReaderPanel && !lgUp ? (
          <div className="fixed inset-0 z-[46] flex flex-col bg-white lg:hidden" role="dialog" aria-label="Sermon map">
            <ReaderSermonMapPanel
              mapId={sermonReaderPanel.mapId}
              mapOptions={uniqueMapOptionsFromRollup(sermonReaderPanel.rollup)}
              onMapIdChange={(id) => setSermonReaderPanel((p) => (p ? { ...p, mapId: id } : null))}
              contextVerse={sermonReaderPanel.verse}
              contextRollup={sermonReaderPanel.rollup}
              onClose={() => setSermonReaderPanel(null)}
              showLeftBorder={false}
            />
          </div>
        ) : null}
        </div>
  );

  const readerMapShell = (
      <div className="relative flex min-h-0 min-w-0 w-full flex-1 overflow-hidden bg-white">
        {mapPanelOpen && lgUp ? (
          <PanelGroup direction="horizontal" autoSaveId="kairos-jbch-reader-map" className="flex min-h-0 min-w-0 flex-1">
            <Panel defaultSize={58} minSize={26} maxSize={82} id="jbch-reader" className="flex min-h-0 min-w-0 flex-col">
              {readerColumn}
            </Panel>
            <LayoutResizeHandle className="bg-neutral-200" />
            <Panel defaultSize={42} minSize={18} maxSize={62} id="jbch-map" className="relative z-30 flex min-h-0 min-w-0 flex-col border-l border-neutral-200">
              <ReaderBibleMapPanel book={book} chapter={chapter} verse={passageVerseForMap} onClose={() => setMapPanelOpen(false)} />
            </Panel>
          </PanelGroup>
        ) : (
          readerColumn
        )}
        {mapPanelOpen && !lgUp ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden" role="dialog" aria-label="Map panel">
            <ReaderBibleMapPanel book={book} chapter={chapter} verse={passageVerseForMap} onClose={() => setMapPanelOpen(false)} fullBleed />
          </div>
        ) : null}
        {!mapPanelOpen && !lgUp && subTab === "text" ? (
          <button
            type="button"
            onClick={() => setMapPanelOpen(true)}
            className="fixed bottom-24 right-5 z-[44] flex h-12 w-12 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-700 shadow-lg transition hover:bg-orange-50"
            aria-label="Open map panel"
          >
            <MapIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
  );

  return (
    <>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{readerMapShell}</div>
      <ReaderPlaceMapPanel />
      <ChapterCastModal
        open={chapterCastOpen}
        onClose={() => setChapterCastOpen(false)}
        book={book}
        chapter={chapter}
        onPickPerson={(ev, prof) => setReaderLore({ event: ev, profile: prof })}
      />
      {readerLore ? (
        <PersonLoreModal
          open
          onClose={() => setReaderLore(null)}
          event={readerLore.event}
          profile={readerLore.profile}
        />
      ) : null}
    </>
  );
}

function DictionaryExperience({ slice, error }: { slice: JbchHubRead["dictionary"]; error: string | null }) {
  const [sel, setSel] = useState(0);
  const blocks = slice.text_blocks;
  const active = blocks[sel] ?? "";

  return (
    <>
      <div className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 bg-white md:w-[min(280px,36vw)] md:max-w-[300px] md:border-b-0 md:border-r">
        <div className="border-b border-neutral-100 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Terms</div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {blocks.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              className={clsx(
                "block w-full border-b border-neutral-50 px-3 py-3 text-left text-sm transition-colors",
                sel === i ? "font-medium" : "hover:bg-neutral-50",
              )}
              style={sel === i ? { borderLeft: `3px solid ${JBCH_ORANGE}`, background: "rgba(255,140,0,0.06)" } : undefined}
            >
              <span className="line-clamp-2 text-neutral-800">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-white px-6 py-8">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <h1 className="text-xl font-bold text-neutral-900">Dictionary</h1>
        <p className="mt-1 text-sm" style={{ color: JBCH_ORANGE }}>
          Kairos glossary
        </p>
        {slice.links.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {slice.links.map((l) => (
              <a
                key={`${l.href}-${l.text}`}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-90"
                style={{ backgroundColor: JBCH_ORANGE }}
              >
                {l.text}
              </a>
            ))}
          </div>
        ) : null}
        <article className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-neutral-800">{active}</article>
        <p className="mx-auto mt-10 max-w-2xl text-xs text-neutral-500">
          More entries:{" "}
          <Link to="/word-study" className="font-medium underline-offset-2 hover:underline" style={{ color: JBCH_ORANGE }}>
            Word studies
          </Link>
        </p>
      </div>
    </>
  );
}

function RecitationExperience({
  page,
  cards,
  error,
}: {
  page: JbchHubRead["recitation_page"];
  cards: JbchRecitationCard[];
  error: string | null;
}) {
  const [sel, setSel] = useState(0);
  const card = cards.length ? (cards[sel] ?? cards[0]) : null;

  return (
    <>
      <div className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 bg-white md:w-[min(280px,36vw)] md:max-w-[300px] md:border-b-0 md:border-r">
        <div className="border-b border-neutral-100 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Passages</div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!cards.length ? <p className="px-3 py-4 text-xs text-neutral-500">No passages loaded.</p> : null}
          {cards.map((c, i) => (
            <button
              key={`${c.reference}-${i}`}
              type="button"
              onClick={() => setSel(i)}
              className={clsx(
                "block w-full border-b border-neutral-50 px-3 py-3 text-left text-sm transition-colors",
                sel === i ? "font-medium" : "hover:bg-neutral-50",
              )}
              style={sel === i ? { borderLeft: `3px solid ${JBCH_ORANGE}`, background: "rgba(255,140,0,0.06)" } : undefined}
            >
              <span className="text-neutral-900">{c.title}</span>
              <span className="mt-0.5 block text-xs text-neutral-500">{c.reference}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#fafafa] px-6 py-8">
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Recitation</h1>
            <p className="mt-1 text-sm text-neutral-500">Memorization drills · WEB samples</p>
          </div>
          <Mic2 className="h-8 w-8 text-neutral-300" strokeWidth={1.25} />
        </div>
        {card ? <RecitationPractice card={card} /> : null}

        {page.text_blocks.length || page.links.length ? (
          <div className="mt-10 border-t border-neutral-200 pt-8">
            <h2 className="text-sm font-semibold text-neutral-900">Recitation notes</h2>
            {page.links.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {page.links.map((l) => (
                  <a
                    key={`${l.href}-${l.text}`}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium underline-offset-2 hover:underline"
                    style={{ color: JBCH_ORANGE }}
                  >
                    {l.text}
                  </a>
                ))}
              </div>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              {page.text_blocks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}
