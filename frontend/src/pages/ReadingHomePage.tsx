import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CHAPTER_COUNT } from "@/lib/bibleCanon";
import {
  appendReading,
  CANON_BOOK_ORDER,
  chapterCountsInRange,
  loadReadingLog,
  parseISODate,
  passagesByLocalDay,
  READING_LOG_CHANGED_EVENT,
  READING_LOG_STORAGE_KEY,
  readingStreakDays,
  refreshReadingLogFromServer,
  type ReadingLogEvent,
  TOTAL_CANON_CHAPTERS,
  uniqueChaptersInRange,
} from "@/lib/readingLog";
import { Button } from "@/components/ui/button";
import { useJournalStore } from "@/store/journalStore";
import type { JournalEntry } from "@/types";
import clsx from "clsx";

const JBCH_ORANGE = "#ff8c00";

type HomeView = "chart" | "attendance";

const TABS: { id: HomeView; label: string }[] = [
  { id: "chart", label: "Reading Status Chart" },
  { id: "attendance", label: "Daily Reading Attendance Sheet" },
];

/** Reads 1–10 use colored tiers; every 11th read (11, 22, …) uses the same neutral style as 0. */
const TIER_COLORS: { n: number; label: string; className: string }[] = [
  { n: 1, label: "1", className: "bg-[#fef9c3] text-neutral-900 ring-1 ring-amber-200/90" },
  { n: 2, label: "2", className: "bg-[#cffafe] text-neutral-900 ring-1 ring-cyan-200/80" },
  { n: 3, label: "3", className: "bg-[#fcd9bd] text-neutral-900 ring-1 ring-orange-200/70" },
  { n: 4, label: "4", className: "bg-[#fbcfe8] text-neutral-900 ring-1 ring-pink-200/80" },
  { n: 5, label: "5", className: "bg-[#fdba74] text-neutral-900 ring-1 ring-orange-300/80" },
  { n: 6, label: "6", className: "bg-[#93c5fd] text-neutral-900 ring-1 ring-blue-300/80" },
  { n: 7, label: "7", className: "bg-[#c4d088] text-neutral-900 ring-1 ring-lime-700/25" },
  { n: 8, label: "8", className: "bg-[#3b82f6] text-white ring-1 ring-blue-700/30" },
  { n: 9, label: "9", className: "bg-[#14b8a6] text-white ring-1 ring-teal-800/30" },
  { n: 10, label: "10", className: "bg-[#166534] text-white ring-1 ring-green-900/40" },
];

function tierClass(count: number): string {
  if (count <= 0) return "border border-neutral-200 bg-white text-neutral-400";
  const r = count % 11;
  if (r === 0) return "border border-neutral-200 bg-white text-neutral-400";
  return TIER_COLORS.find((t) => t.n === r)!.className;
}

function defaultRange(): { from: string; to: string } {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

function PieProgress({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" className="h-36 w-36" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={JBCH_ORANGE}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <p className="text-sm font-medium text-neutral-700">{p.toFixed(1)}% of Bible touched</p>
      <p className="text-center text-xs text-neutral-500">Unique chapters with at least one reading in the selected range.</p>
    </div>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <p className="text-5xl font-bold tabular-nums" style={{ color: JBCH_ORANGE }}>
        {streak}
      </p>
      <p className="text-sm font-semibold text-neutral-800">day streak</p>
      <p className="max-w-[14rem] text-xs leading-relaxed text-neutral-500">
        Consecutive local days with at least one reading log. If you have not logged today yet, yesterday can still continue the streak.
      </p>
    </div>
  );
}

function journalCellLabel(entry: JournalEntry): string {
  const t = entry.title?.trim();
  if (t) return t;
  const raw = entry.body?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
  if (raw.length > 0) return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;
  return "Journal";
}

function StatusChartPanel({
  events,
  streak,
  onLogRefresh,
}: {
  events: ReadingLogEvent[];
  streak: number;
  onLogRefresh: () => void;
}) {
  const { from: defFrom, to: defTo } = defaultRange();
  const [fromStr, setFromStr] = useState(defFrom);
  const [toStr, setToStr] = useState(defTo);

  const fromD = parseISODate(fromStr) ?? new Date(defFrom);
  const toD = parseISODate(toStr) ?? new Date(defTo);

  const counts = useMemo(() => chapterCountsInRange(events, fromD, toD), [events, fromD, toD]);
  const uniqueRead = useMemo(() => uniqueChaptersInRange(events, fromD, toD), [events, fromD, toD]);
  const pct = TOTAL_CANON_CHAPTERS > 0 ? (uniqueRead / TOTAL_CANON_CHAPTERS) * 100 : 0;

  const bumpChapter = useCallback(
    async (book: string, chapter: number) => {
      await appendReading(book, chapter);
      onLogRefresh();
    },
    [onLogRefresh],
  );

  return (
    <div className="space-y-6 px-4 pb-16 pt-2 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-neutral-600">Filter by date</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm"
          />
          <span className="text-neutral-400">to</span>
          <input
            type="date"
            value={toStr}
            onChange={(e) => setToStr(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Color guide by times read (in range)</p>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50/80 p-2">
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] shadow-sm">
            <span className={clsx("h-5 w-5 shrink-0 rounded-full", tierClass(0))} />
            <span className="text-neutral-600">0</span>
          </div>
          {TIER_COLORS.map((t) => (
            <div key={t.n} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] shadow-sm">
              <span className={clsx("h-5 w-5 shrink-0 rounded-full", t.className)} />
              <span className="text-neutral-600">{t.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          <span className="font-medium text-neutral-600">0</span> = not read in this date range (neutral). Reads <span className="font-medium">1–10</span> cycle through the colors; the{" "}
          <span className="font-medium">11th</span> read (then 22nd, 33rd, …) uses the same neutral look as 0, then the 12th matches 1 again.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex justify-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <PieProgress pct={pct} />
        </div>
        <div className="flex justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
          <StreakCard streak={streak} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Chapter grid
        </div>
        <div className="max-h-[min(70vh,720px)] overflow-y-auto">
          {CANON_BOOK_ORDER.map((book, idx) => {
            const n = CHAPTER_COUNT[book] ?? 0;
            const bookMap = counts.get(book);
            return (
              <div
                key={book}
                className={clsx(
                  "flex border-b border-neutral-100/90 text-sm",
                  idx % 2 === 1 ? "bg-neutral-50/80" : "bg-white",
                )}
              >
                <div className="w-[min(7.5rem,28vw)] shrink-0 border-r border-neutral-100 px-2 py-2 font-medium text-neutral-800">
                  {book}
                </div>
                <div className="min-w-0 flex-1 overflow-x-auto px-1 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: n }, (_, i) => {
                      const ch = i + 1;
                      const c = bookMap?.get(ch) ?? 0;
                      return (
                        <button
                          key={ch}
                          type="button"
                          title={`${book} ${ch} — ${c} in range (click to log)`}
                          onClick={() => void bumpChapter(book, ch)}
                          className={clsx(
                            "flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-1 text-[11px] font-medium transition hover:opacity-90",
                            tierClass(c),
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AttendancePanel({ events }: { events: ReadingLogEvent[] }) {
  const fetchEntries = useJournalStore((s) => s.fetchEntries);
  const journalEntries = useJournalStore((s) => s.entries);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const byDay = useMemo(() => passagesByLocalDay(events), [events]);
  const journalByDate = useMemo(() => {
    const m = new Map<string, JournalEntry>();
    for (const j of journalEntries) {
      m.set(j.entry_date, j);
    }
    return m;
  }, [journalEntries]);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);

  const label = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const go = (delta: number) => {
    setCursor(new Date(year, month + delta, 1));
  };

  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  return (
    <div className="space-y-4 px-4 pb-16 pt-2 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">{label}</h2>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {weekdays.map((w) => (
            <div key={w} className="border-r border-neutral-100 py-2 last:border-r-0">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`e-${i}`} className="min-h-[8rem] border-b border-r border-neutral-100 bg-neutral-50/50 last:border-r-0" />;
            }
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const passages = byDay.get(key) ?? [];
            const journal = journalByDate.get(key);
            const todayCell = isToday(day);
            const hasReading = passages.length > 0;
            return (
              <div
                key={key}
                className={clsx(
                  "flex min-h-[8rem] flex-col border-b border-r border-neutral-100 p-1.5 last:border-r-0",
                  todayCell && "bg-[#fffbeb]",
                  hasReading && "border-l-[3px] border-l-orange-400",
                )}
              >
                <span className="mb-1 self-end text-[11px] font-medium text-neutral-400">{day}</span>
                {passages.length > 0 ? (
                  <ul className="mb-1 space-y-0.5 text-[10px] leading-tight text-neutral-700">
                    {passages.map((p) => (
                      <li key={`${p.book}-${p.chapter}`} className="truncate" title={`${p.book} ${p.chapter}`}>
                        {p.book} {p.chapter}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {journal ? (
                  <Link
                    to={`/journal?date=${key}`}
                    className="mt-auto truncate rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-1 text-[10px] font-medium text-neutral-800 hover:bg-neutral-100"
                    title="Open journal for this day"
                  >
                    {journalCellLabel(journal)}
                  </Link>
                ) : (
                  <Link
                    to={`/journal?date=${key}`}
                    className="mt-auto text-center text-[10px] text-neutral-400 hover:text-neutral-600 hover:underline"
                  >
                    + Journal
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-neutral-500">
        Chapters list every passage logged that day. Links open your daily journal for that date (same as the Journal page).
      </p>
    </div>
  );
}

export function ReadingHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = (searchParams.get("view") || "chart").toLowerCase();
  const view: HomeView = raw === "attendance" ? "attendance" : "chart";

  useEffect(() => {
    if (raw !== "chart" && raw !== "attendance") {
      const next = new URLSearchParams(searchParams);
      next.set("view", "chart");
      setSearchParams(next, { replace: true });
    }
  }, [raw, searchParams, setSearchParams]);

  const setView = (v: HomeView) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const [events, setEvents] = useState<ReadingLogEvent[]>([]);

  const refresh = useCallback(() => {
    setEvents(loadReadingLog());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshReadingLogFromServer();
      if (!cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === READING_LOG_STORAGE_KEY) refresh();
    };
    window.addEventListener(READING_LOG_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(READING_LOG_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const streak = useMemo(() => readingStreakDays(events), [events]);

  const title = view === "chart" ? "Reading Status Chart" : "Daily Reading Attendance Sheet";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#fafafa]">
      <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">{title}</h1>
        </div>
      </header>

      <div className="shrink-0 border-b border-neutral-200 bg-white px-2 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          {TABS.map(({ id, label }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-white shadow-sm" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80",
                )}
                style={active ? { backgroundColor: JBCH_ORANGE } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-5xl">
          {view === "chart" ? <StatusChartPanel events={events} streak={streak} onLogRefresh={refresh} /> : null}
          {view === "attendance" ? <AttendancePanel events={events} /> : null}
        </div>
      </div>
    </div>
  );
}
