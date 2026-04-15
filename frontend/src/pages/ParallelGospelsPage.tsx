import type { CSSProperties } from "react";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Moon, Search, Star, Sun } from "lucide-react";

import { api } from "@/api/client";
import { GOSPEL_META, PARALLEL_GOSPEL_SECTIONS, type GospelKey } from "@/lib/parallelGospelsData";
import type { ChapterTextResponse } from "@/types";

const LS_KEY = "kairos-parallel-gospels";

type Prefs = {
  dark: boolean;
  font: number;
  line: number;
  sync: boolean;
  bookmarks: number[];
};

const DEFAULT_PREFS: Prefs = { dark: false, font: 18, line: 1.65, sync: true, bookmarks: [] };
const ALL_GOSPELS: GospelKey[] = ["matthew", "mark", "luke", "john"];
const chapterCache = new Map<string, ChapterTextResponse>();

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function gospelCountFor(sections: typeof PARALLEL_GOSPEL_SECTIONS, key: GospelKey): number {
  return sections.filter((s) => Boolean(s.refs[key])).length;
}

function Placeholder({ gospel, note }: { gospel: string; note?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-black/20 bg-black/5 p-3 text-sm italic text-neutral-500">
      Not recorded in {gospel}.{note ? ` ${note}` : ""}
    </div>
  );
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

function isVerseInAnySegment(verse: number, segments: Array<{ start: number; end: number }>): boolean {
  return segments.some((s) => verse >= s.start && verse <= s.end);
}

function PassageText({ refText, font, line, accent }: { refText: string; font: number; line: number; accent: string }) {
  const [text, setText] = useState<string>("Loading passage...");

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
          const key = `${parsed.book}-${ch}-KJV`;
          let data = chapterCache.get(key);
          if (!data) {
            const res = await api.get<ChapterTextResponse>("/scripture/chapter", {
              params: { book: parsed.book, chapter: ch, translation: "KJV" },
            });
            data = res.data;
            chapterCache.set(key, data);
          }
          const segs = parsed.chapterSegments[ch] ?? [{ start: 1, end: 999 }];
          if (!data) continue;
          const rows = data.verses.filter((v: ChapterTextResponse["verses"][number]) => isVerseInAnySegment(v.verse, segs));
          if (rows.length) {
            chunks.push(rows.map((v) => `${v.verse}. ${v.text}`).join(" "));
          }
        }
        if (live) setText(chunks.join(" "));
      } catch {
        if (live) setText("Could not load verse text for this passage yet.");
      }
    };
    void load();
    return () => {
      live = false;
    };
  }, [refText]);

  return (
    <p className="mt-1 opacity-90" style={{ fontSize: `${font}px`, lineHeight: line }}>
      <sup style={{ color: accent }}>1</sup> {text}
    </p>
  );
}

export function ParallelGospelsPage() {
  const [prefs, setPrefs] = useState<Prefs>(() => (typeof window !== "undefined" ? loadPrefs() : DEFAULT_PREFS));
  const [query, setQuery] = useState("");
  const [jumpId, setJumpId] = useState<number>(1);
  const [focus, setFocus] = useState<GospelKey | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [currentSection, setCurrentSection] = useState(PARALLEL_GOSPEL_SECTIONS[0] ?? null);
  const [mobileKey, setMobileKey] = useState<GospelKey>("matthew");
  const [tabletKeys, setTabletKeys] = useState<[GospelKey, GospelKey]>(["matthew", "mark"]);
  const [showTracker, setShowTracker] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [visibleGospels, setVisibleGospels] = useState<GospelKey[]>(ALL_GOSPELS);
  const [showNavigator, setShowNavigator] = useState(false);
  const [expandedSectionIds, setExpandedSectionIds] = useState<number[]>([]);
  const topRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const colRefs = useRef<Record<GospelKey, HTMLDivElement | null>>({
    matthew: null,
    mark: null,
    luke: null,
    john: null,
  });
  const syncingRef = useRef(false);
  const [toolbarH, setToolbarH] = useState(56);

  useLayoutEffect(() => {
    const el = topRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setToolbarH(Math.ceil(el.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => savePrefs(prefs), [prefs]);

  useEffect(() => {
    const prevBody = document.body.style.backgroundColor;
    const prevRoot = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = prefs.dark ? "#0d0d12" : "#f5f0e8";
    document.body.style.backgroundColor = prefs.dark ? "#0d0d12" : "#f5f0e8";
    return () => {
      document.documentElement.style.backgroundColor = prevRoot;
      document.body.style.backgroundColor = prevBody;
    };
  }, [prefs.dark]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PARALLEL_GOSPEL_SECTIONS;
    return PARALLEL_GOSPEL_SECTIONS.filter((s) =>
      [s.group, s.title, s.refs.matthew, s.refs.mark, s.refs.luke, s.refs.john].some((x) => (x ?? "").toLowerCase().includes(q)),
    );
  }, [query]);

  const syncFrom = (source: GospelKey) => {
    if (!prefs.sync || syncingRef.current) return;
    const src = colRefs.current[source];
    if (!src) return;
    syncingRef.current = true;
    const st = src.scrollTop;
    (["matthew", "mark", "luke", "john"] as GospelKey[]).forEach((k) => {
      if (k === source) return;
      const node = colRefs.current[k];
      if (node) node.scrollTop = st;
    });
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible) return;
        const sid = Number((visible.target as HTMLElement).dataset.sectionId);
        const sec = PARALLEL_GOSPEL_SECTIONS.find((s) => s.id === sid);
        if (sec) setCurrentSection(sec);
      },
      { rootMargin: "-160px 0px -65% 0px", threshold: [0.25, 0.5] },
    );
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-section-id]"));
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [filtered]);

  const jumpTo = (id: number) => {
    setJumpId(id);
    const el = document.getElementById(`parallel-section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleBookmark = (id: number) =>
    setPrefs((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [...p.bookmarks, id].sort((a, b) => a - b),
    }));

  const verseClick = (ref: string | null) => {
    if (!ref) return;
    const cards = document.querySelectorAll<HTMLElement>(`[data-ref="${CSS.escape(ref)}"]`);
    cards.forEach((c) => c.classList.add("ring-2", "ring-yellow-500/70"));
    setTimeout(() => cards.forEach((c) => c.classList.remove("ring-2", "ring-yellow-500/70")), 1400);
  };

  const colClass = (key: GospelKey) => {
    if (!visibleGospels.includes(key)) return "hidden";
    if (!focus) return "w-full lg:w-1/4";
    if (focus === key) return "w-full lg:w-1/2";
    return "w-full lg:w-[16.66%]";
  };

  const toggleGospel = (key: GospelKey) =>
    setVisibleGospels((curr) => {
      if (curr.includes(key)) {
        if (curr.length === 1) return curr;
        return curr.filter((k) => k !== key);
      }
      return [...curr, key];
    });
  const toggleSection = (id: number) =>
    setExpandedSectionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const groupedSections = useMemo(() => {
    const map = new Map<string, typeof PARALLEL_GOSPEL_SECTIONS>();
    filtered.forEach((s) => {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    });
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    if (!showNavigator || !currentSection) return;
    const item = navItemRefs.current[currentSection.id];
    if (!item) return;
    item.scrollIntoView({ block: "nearest" });
  }, [currentSection, showNavigator]);

  return (
    <div
      className="min-h-[100dvh]"
      style={
        {
          ["--pg-toolbar-h" as string]: `${toolbarH}px`,
          background: prefs.dark ? "#0d0d12" : "#f5f0e8",
          color: prefs.dark ? "#ece7dd" : "#2a2418",
          fontFamily: "EB Garamond, serif",
        } as CSSProperties
      }
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:wght@400;500;700&display=swap');
        .pg-head{font-family:Cinzel,serif}
      `}</style>
      <div
        ref={topRef}
        className="sticky top-0 z-50 border-b border-black/10 bg-inherit/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-inherit/90"
      >
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-3 py-2">
          <Link to="/" className="inline-flex items-center gap-1 rounded border border-black/10 px-2 py-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Reader
          </Link>
          <span className="pg-head text-lg">Parallel Gospels</span>
          <span className="mx-auto hidden text-sm md:inline">{currentSection ? `${currentSection.id}. ${currentSection.title}` : "Parallel Reader"}</span>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setPrefs((p) => ({ ...p, dark: !p.dark }))}>
            {prefs.dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setPrefs((p) => ({ ...p, font: Math.max(14, p.font - 1) }))}>A-</button>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setPrefs((p) => ({ ...p, font: Math.min(26, p.font + 1) }))}>A+</button>
          <button className={`rounded border px-2 py-1 text-xs ${prefs.sync ? "border-green-600 text-green-700" : "border-black/10"}`} onClick={() => setPrefs((p) => ({ ...p, sync: !p.sync }))}>
            Sync Scroll {prefs.sync ? "ON" : "OFF"}
          </button>
          <button className={`rounded border px-2 py-1 text-xs ${showDiff ? "border-yellow-700 text-yellow-700" : "border-black/10"}`} onClick={() => setShowDiff((v) => !v)}>
            Show differences
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Search className="h-4 w-4 opacity-70" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all gospels..." className="rounded border border-black/10 bg-transparent px-2 py-1 text-xs" />
          </div>
          <select value={jumpId} onChange={(e) => jumpTo(Number(e.target.value))} className="rounded border border-black/10 bg-transparent px-2 py-1 text-xs">
            {PARALLEL_GOSPEL_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.id}. {s.title}</option>
            ))}
          </select>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setShowTracker((v) => !v)}>Silence tracker</button>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setShowBookmarks((v) => !v)}>Bookmarks</button>
          <button className="rounded border border-black/10 px-2 py-1 text-xs" onClick={() => setShowNavigator((v) => !v)}>
            Navigator
          </button>
          <div className="ml-1 flex items-center gap-1">
            {ALL_GOSPELS.map((k) => (
              <button
                key={`filter-${k}`}
                className={`rounded border px-2 py-1 text-xs ${visibleGospels.includes(k) ? "text-white" : "border-black/20 text-black/60"}`}
                style={visibleGospels.includes(k) ? { background: GOSPEL_META[k].accent, borderColor: GOSPEL_META[k].accent } : undefined}
                onClick={() => toggleGospel(k)}
                title={`Toggle ${GOSPEL_META[k].label}`}
              >
                {GOSPEL_META[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showBookmarks ? (
        <div className="mx-auto mt-2 max-w-[1800px] rounded border border-black/10 bg-white/60 p-2 text-sm">
          <p className="font-semibold">Bookmarked Sections</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {prefs.bookmarks.length ? prefs.bookmarks.map((id) => (
              <button key={id} className="rounded border border-black/10 px-2 py-0.5 text-xs" onClick={() => jumpTo(id)}>
                {id}. {PARALLEL_GOSPEL_SECTIONS.find((s) => s.id === id)?.title ?? "Section"}
              </button>
            )) : <span className="text-xs opacity-70">No bookmarks yet.</span>}
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-3 flex max-w-[1800px] items-start gap-3 px-2 pb-6">
        {showNavigator ? (
          <aside
            ref={navRef}
            className="hidden w-72 shrink-0 self-start rounded border border-black/10 bg-white/90 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:sticky lg:top-[var(--pg-toolbar-h)] lg:z-[45] lg:block lg:max-h-[calc(100dvh-var(--pg-toolbar-h)-12px)] lg:overflow-y-auto lg:overscroll-contain"
          >
            <p className="pg-head text-sm">Quick Navigator</p>
            {groupedSections.map(([group, items]) => (
              <div key={`nav-${group}`} className="mt-2">
                <p className="text-[11px] font-semibold opacity-70">{group}</p>
                <div className="mt-1 grid grid-cols-1 gap-1">
                  {items.map((s) => (
                    <button
                      key={`jump-${s.id}`}
                      ref={(el) => {
                        navItemRefs.current[s.id] = el;
                      }}
                      onClick={() => jumpTo(s.id)}
                      className={`rounded border px-2 py-1 text-left text-[11px] ${currentSection?.id === s.id ? "border-amber-500 bg-amber-100/60" : "border-black/10 bg-white/70"}`}
                    >
                      {s.id}. {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
        ) : null}
        {showTracker ? (
          <aside className="hidden w-56 shrink-0 self-start rounded border border-black/10 bg-white/90 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:sticky lg:top-[var(--pg-toolbar-h)] lg:z-[45] lg:block lg:max-h-[calc(100dvh-var(--pg-toolbar-h)-12px)] lg:overflow-y-auto lg:overscroll-contain">
            <p className="pg-head text-sm">Silence Tracker</p>
            <div className="mt-2 grid grid-cols-5 gap-1 text-[10px]">
              <span>#</span><span>M</span><span>Mk</span><span>L</span><span>J</span>
              {PARALLEL_GOSPEL_SECTIONS.map((s) => (
                <Fragment key={s.id}>
                  <button type="button" onClick={() => jumpTo(s.id)} className="text-left underline">
                    {s.id}
                  </button>
                  {(["matthew", "mark", "luke", "john"] as GospelKey[]).map((k) => (
                    <button
                      key={`${s.id}-${k}`}
                      type="button"
                      onClick={() => jumpTo(s.id)}
                      className={`h-3 w-3 rounded-full ${s.refs[k] ? "bg-black/70" : "border border-black/30"}`}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
          <div
            className="sticky z-30 mb-2 hidden gap-2 bg-inherit/95 backdrop-blur md:flex"
            style={{ top: "var(--pg-toolbar-h)" }}
          >
            {ALL_GOSPELS.filter((k) => visibleGospels.includes(k)).map((k) => {
              const m = GOSPEL_META[k];
              const total = gospelCountFor(PARALLEL_GOSPEL_SECTIONS, k) || 1;
              const seen = PARALLEL_GOSPEL_SECTIONS.filter((s) => s.id <= (currentSection?.id ?? 0) && s.refs[k]).length;
              const progress = Math.round((seen / total) * 100);
              return (
                <div key={k} className={`${colClass(k)} rounded border bg-white/80 p-2`} style={{ borderColor: m.accent }}>
                  <button className="w-full text-left" onClick={() => setFocus((f) => (f === k ? null : k))}>
                    <p className="pg-head text-sm" style={{ color: m.accent }}>{m.label}</p>
                    <p className="text-[11px] opacity-80">{m.author} • {m.theme}</p>
                    <div className="mt-1 h-1.5 rounded bg-black/10">
                      <div className="h-1.5 rounded" style={{ width: `${progress}%`, background: m.accent }} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mb-2 flex items-center gap-2 md:hidden">
            <select value={mobileKey} onChange={(e) => setMobileKey(e.target.value as GospelKey)} className="rounded border border-black/10 bg-transparent px-2 py-1 text-xs">
              {ALL_GOSPELS.filter((k) => visibleGospels.includes(k)).map((k) => <option key={k} value={k}>{GOSPEL_META[k].label}</option>)}
            </select>
            <button
              className="rounded border border-black/10 px-2 py-1 text-xs"
              onClick={() => setTabletKeys((p) => (p[0] === "matthew" && p[1] === "mark" ? ["luke", "john"] : ["matthew", "mark"]))}
            >
              Compare 2-column
            </button>
          </div>

          <div ref={gridRef} className="space-y-2">
            {filtered.map((s) => (
              <section
                key={s.id}
                id={`parallel-section-${s.id}`}
                data-section-id={s.id}
                className={`rounded border ${currentSection?.id === s.id ? "bg-yellow-100/50 border-yellow-400/50" : "bg-white/60 border-black/10"} p-2`}
              >
                <div className="mb-2 flex w-full cursor-pointer flex-wrap items-center gap-2 border-b border-black/10 pb-2 text-left" onClick={() => toggleSection(s.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection(s.id); } }}>
                  <button onClick={(e) => { e.stopPropagation(); toggleBookmark(s.id); }} className="rounded p-1 hover:bg-black/5" aria-label="Bookmark section">
                    <Star className={`h-4 w-4 ${prefs.bookmarks.includes(s.id) ? "fill-yellow-500 text-yellow-600" : "text-black/60"}`} />
                  </button>
                  <span className="pg-head text-sm">{s.id}. {s.title}</span>
                  <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px]">{s.group}</span>
                  <span className="rounded border border-black/15 px-1.5 py-0.5 text-[10px]">{expandedSectionIds.includes(s.id) ? "Hide passages" : "Show passages"}</span>
                  <span className="ml-auto text-[10px]">
                  {ALL_GOSPELS.map((k) => (
                      <span key={k} className={`mx-0.5 inline-block h-2.5 w-2.5 rounded-full ${s.refs[k] ? "" : "opacity-20"}`} style={{ background: GOSPEL_META[k].accent }} />
                    ))}
                  </span>
                </div>

                {expandedSectionIds.includes(s.id) ? (
                <div className="hidden gap-2 md:grid md:grid-cols-2 lg:grid-cols-4">
                  {ALL_GOSPELS.filter((k) => visibleGospels.includes(k)).map((k) => {
                    if (focus && focus !== k) {
                      return (
                        <div key={k} className="rounded border border-black/10 bg-white/70 p-2 text-xs">
                          <p style={{ color: GOSPEL_META[k].accent }} className="pg-head">{GOSPEL_META[k].label}</p>
                          <p className="mt-1 opacity-60">{s.refs[k] ? s.refs[k] : "Not recorded"}</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={k}
                        ref={(n) => {
                          colRefs.current[k] = n;
                        }}
                        onScroll={() => syncFrom(k)}
                        className={`rounded border bg-white p-2 ${showDiff && s.refs[k] && (["matthew", "mark", "luke", "john"] as GospelKey[]).filter((x) => s.refs[x]).length === 1 ? "border-yellow-400 bg-yellow-50" : "border-black/10"}`}
                        style={{ borderLeft: `4px solid ${GOSPEL_META[k].accent}`, fontSize: `${prefs.font}px`, lineHeight: prefs.line }}
                        data-ref={s.refs[k] ?? ""}
                        onClick={() => verseClick(s.refs[k])}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (s.refs[k]) void navigator.clipboard?.writeText(s.refs[k] ?? "");
                        }}
                      >
                        <p className="pg-head text-xs" style={{ color: GOSPEL_META[k].accent }}>{GOSPEL_META[k].label}</p>
                        {s.refs[k] ? (
                          <>
                            <p className="mt-1 text-[11px] font-semibold">{s.refs[k]}</p>
                            <PassageText refText={s.refs[k] ?? ""} font={prefs.font} line={prefs.line} accent={GOSPEL_META[k].accent} />
                          </>
                        ) : (
                          <Placeholder gospel={GOSPEL_META[k].label} note={s.note} />
                        )}
                      </div>
                    );
                  })}
                </div>
                ) : null}

                {expandedSectionIds.includes(s.id) ? (
                <div className="space-y-2 md:hidden">
                  {(() => {
                    const currentMobile = visibleGospels.includes(mobileKey) ? mobileKey : visibleGospels[0] ?? "matthew";
                    const list: GospelKey[] = window.innerWidth < 768 ? [currentMobile] : tabletKeys.filter((k) => visibleGospels.includes(k));
                    return list.map((k) => (
                      <div key={k} className="rounded border border-black/10 bg-white p-2" style={{ borderLeft: `4px solid ${GOSPEL_META[k].accent}` }}>
                        <p className="pg-head text-xs" style={{ color: GOSPEL_META[k].accent }}>{GOSPEL_META[k].label}</p>
                        {s.refs[k] ? (
                          <>
                            <p className="mt-1 text-[11px] font-semibold">{s.refs[k]}</p>
                            <PassageText refText={s.refs[k] ?? ""} font={prefs.font} line={prefs.line} accent={GOSPEL_META[k].accent} />
                          </>
                        ) : (
                          <Placeholder gospel={GOSPEL_META[k].label} note={s.note} />
                        )}
                      </div>
                    ));
                  })()}
                </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

