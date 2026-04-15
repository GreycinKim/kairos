import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { loadBibleLocationsCatalog } from "@/lib/bibleLocationsCatalog";
import { locationIndexById } from "@/lib/biblicalRoutesCatalog";
import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";
import { buildBiblePlaceMatchList, splitTextByBiblePlaceNames } from "@/lib/splitTextByBiblePlaceNames";
import { useReaderPlaceMapStore } from "@/store/readerPlaceMapStore";
import {
  blbConcordanceUrl,
  blbInterlinearUrl,
  blbLexiconHubUrl,
  blbSearchUrl,
} from "@/lib/blbUrls";
import type { BibleVersionId } from "@/lib/bibleVersions";
import type {
  ChapterVerseRow,
  FlowMapChapterIndexResponse,
  FlowMapVerseRollup,
  ReaderHighlightRead,
  ReaderVerseNoteRead,
} from "@/types";

const JBCH_ORANGE = "#ff8c00";

type HlPiece =
  | { kind: "text"; a: number; b: number }
  | { kind: "mark"; a: number; b: number; id: string; color: string };

function highlightPieces(text: string, hs: ReaderHighlightRead[]): HlPiece[] {
  const sorted = [...hs].sort((x, y) => x.start_offset - y.start_offset);
  const pieces: HlPiece[] = [];
  let c = 0;
  for (const h of sorted) {
    if (h.start_offset > c) pieces.push({ kind: "text", a: c, b: h.start_offset });
    if (h.end_offset > h.start_offset) {
      pieces.push({ kind: "mark", a: h.start_offset, b: h.end_offset, id: h.id, color: h.color });
    }
    c = Math.max(c, h.end_offset);
  }
  if (c < text.length) pieces.push({ kind: "text", a: c, b: text.length });
  return pieces;
}

function stripWordPunct(w: string) {
  return w.replace(/^[\s"'“‘(\[]+|[\s"'”’).,;:!?…\]]+$/g, "").trim();
}

function hasFlowMapInfo(row: FlowMapVerseRollup | undefined): boolean {
  if (!row) return false;
  return row.in_maps.length > 0 || row.leads_to.length > 0 || row.led_from.length > 0;
}

function flowHoverLabel(row: FlowMapVerseRollup): string {
  const to = row.leads_to.slice(0, 3).map((x) => x.ref_label);
  const from = row.led_from.slice(0, 3).map((x) => x.ref_label);
  const toText = to.length ? `Leads to: ${to.join(", ")}` : "Leads to: none";
  const fromText = from.length ? `Led from: ${from.join(", ")}` : "Led from: none";
  return `${toText}\n${fromText}`;
}

function selectionOffsetsIn(container: HTMLElement | null): { start: number; end: number; text: string } | null {
  if (!container) return null;
  const sel = window.getSelection();
  if (!sel?.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  if (!container.contains(r.commonAncestorContainer)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(container);
  pre.setEnd(r.startContainer, r.startOffset);
  const start = pre.toString().length;
  const text = r.toString();
  return { start, end: start + text.length, text };
}

export function VerseInteractiveChapter({
  book,
  chapter,
  translation,
  verses,
  fontPx,
  flowMapByVerse,
  onToggleSermonMapForVerse,
  scrollRootRef,
  onDominantVisibleVerse,
}: {
  book: string;
  chapter: number;
  translation: BibleVersionId;
  verses: ChapterVerseRow[];
  fontPx: number;
  /** Per-verse sermon / passage map rollup; only passed when the reader Text tab is active. */
  flowMapByVerse?: FlowMapChapterIndexResponse["verses"];
  /** Click branch: toggle sermon map panel for this verse (parent opens/closes embed). */
  onToggleSermonMapForVerse?: (verse: number, rollup: FlowMapVerseRollup) => void;
  /** Scroll container for verse visibility (map selection). */
  scrollRootRef?: RefObject<HTMLElement | null>;
  /** Fired when a verse block is most visible while scrolling (debounced by parent). */
  onDominantVisibleVerse?: (verse: number) => void;
}) {
  const [highlights, setHighlights] = useState<ReaderHighlightRead[]>([]);
  const [notes, setNotes] = useState<ReaderVerseNoteRead[]>([]);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);
  const [selRange, setSelRange] = useState<{ verse: number; start: number; end: number; text: string } | null>(null);
  const [wordModal, setWordModal] = useState<{ word: string; verse: number } | null>(null);
  const [noteModal, setNoteModal] = useState<{ verse: number; body: string; id?: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const verseRootRefs = useRef<Map<number, HTMLParagraphElement | null>>(new Map());
  const [bibleCatalogById, setBibleCatalogById] = useState<Map<string, BibleMapLocationJson> | null>(null);
  const [placeMatchList, setPlaceMatchList] = useState<ReturnType<typeof buildBiblePlaceMatchList> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadBibleLocationsCatalog()
      .then((locs) => {
        if (cancelled) return;
        setBibleCatalogById(locationIndexById(locs));
        setPlaceMatchList(buildBiblePlaceMatchList(locs));
      })
      .catch(() => {
        if (!cancelled) {
          setBibleCatalogById(null);
          setPlaceMatchList([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAnnotations = useCallback(async () => {
    try {
      const [hRes, nRes] = await Promise.all([
        api.get<ReaderHighlightRead[]>("/reader/highlights", {
          params: { book, chapter, translation },
        }),
        api.get<ReaderVerseNoteRead[]>("/reader/verse-notes", {
          params: { book, chapter, translation },
        }),
      ]);
      setHighlights(hRes.data);
      setNotes(nRes.data);
    } catch {
      setHighlights([]);
      setNotes([]);
    }
  }, [book, chapter, translation]);

  useEffect(() => {
    void loadAnnotations();
  }, [loadAnnotations]);

  useEffect(() => {
    if (!onDominantVisibleVerse || !verses.length) return;
    const root = scrollRootRef?.current ?? null;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const id = visible[0]?.target.id ?? "";
        const m = /^kairos-verse-(\d+)$/.exec(id);
        if (m) onDominantVisibleVerse(Number(m[1]));
      },
      { root, rootMargin: "-10% 0px -38% 0px", threshold: [0.06, 0.15, 0.35] },
    );
    for (const row of verses) {
      const el = document.getElementById(`kairos-verse-${row.verse}`);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [onDominantVisibleVerse, scrollRootRef, verses, book, chapter]);

  const notesByVerse = useMemo(() => {
    const m = new Map<number, ReaderVerseNoteRead[]>();
    for (const n of notes) {
      if (!m.has(n.verse)) m.set(n.verse, []);
      m.get(n.verse)!.push(n);
    }
    return m;
  }, [notes]);

  const highlightsByVerse = useMemo(() => {
    const m = new Map<number, ReaderHighlightRead[]>();
    for (const h of highlights) {
      if (!m.has(h.verse)) m.set(h.verse, []);
      m.get(h.verse)!.push(h);
    }
    return m;
  }, [highlights]);

  const jumpMarks = useMemo(() => {
    const m = verses.length;
    if (m <= 0) return [];
    const marks = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
    return marks.filter((x) => x <= m);
  }, [verses]);

  const scrollToVerse = (v: number) => {
    document.getElementById(`kairos-verse-${v}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onMouseUp = () => {
    window.setTimeout(() => {
      let found: { verse: number; start: number; end: number; text: string } | null = null;
      let el: HTMLElement | null = null;
      for (const row of verses) {
        const root = verseRootRefs.current.get(row.verse);
        if (!root) continue;
        const off = selectionOffsetsIn(root);
        if (off && off.text.trim()) {
          found = { verse: row.verse, ...off };
          el = root;
          break;
        }
      }
      if (!found || !el) {
        setToolbar(null);
        setSelRange(null);
        return;
      }
      setSelRange(found);
      const sel2 = window.getSelection();
      const rect = sel2?.rangeCount ? sel2.getRangeAt(0).getBoundingClientRect() : el.getBoundingClientRect();
      setToolbar({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }, 0);
  };

  const saveHighlight = async () => {
    if (!selRange || !selRange.text.trim()) return;
    try {
      await api.post<ReaderHighlightRead>("/reader/highlights", {
        book,
        chapter,
        verse: selRange.verse,
        translation,
        start_offset: selRange.start,
        end_offset: selRange.end,
        color: "#fef08a",
        highlighted_text: selRange.text,
      });
      window.getSelection()?.removeAllRanges();
      setToolbar(null);
      setSelRange(null);
      await loadAnnotations();
    } catch {
      /* ignore */
    }
  };

  const removeHighlight = async (id: string) => {
    try {
      await api.delete(`/reader/highlights/${id}`);
      await loadAnnotations();
    } catch {
      /* ignore */
    }
  };

  const saveWordStudy = async () => {
    if (!wordModal) return;
    try {
      const { data } = await api.post<{ id: string }>("/word-studies/from-reader", {
        word: wordModal.word,
        book,
        chapter,
        verse: wordModal.verse,
        translation,
      });
      setSaveMsg(`Saved to dictionary.`);
      setWordModal(null);
      setTimeout(() => setSaveMsg(null), 4000);
      void data;
    } catch {
      setSaveMsg("Could not save (is the API running?)");
    }
  };

  const openNote = (verse: number) => {
    const existing = notesByVerse.get(verse)?.[0];
    setNoteModal({ verse, body: existing?.body ?? "", id: existing?.id });
  };

  const saveNote = async () => {
    if (!noteModal) return;
    try {
      if (noteModal.id) {
        await api.patch(`/reader/verse-notes/${noteModal.id}`, { body: noteModal.body });
      } else {
        await api.post("/reader/verse-notes", {
          book,
          chapter,
          verse: noteModal.verse,
          translation,
          body: noteModal.body,
        });
      }
      setNoteModal(null);
      await loadAnnotations();
    } catch {
      /* ignore */
    }
  };

  const renderVerseInner = (text: string, verse: number) => {
    const hs = highlightsByVerse.get(verse) ?? [];
    const pieces = highlightPieces(text, hs);
    return pieces.map((p, idx) => {
      if (p.kind === "mark") {
        const seg = text.slice(p.a, p.b);
        return (
          <mark key={`${p.id}-${idx}`} style={{ backgroundColor: p.color }} className="rounded-sm px-0.5">
            {seg}
            <button
              type="button"
              className="ml-0.5 align-super text-[10px] text-neutral-600 hover:text-red-600"
              aria-label="Remove highlight"
              onClick={() => void removeHighlight(p.id)}
            >
              ×
            </button>
          </mark>
        );
      }
      const slice = text.slice(p.a, p.b);
      const placeParts =
        placeMatchList && placeMatchList.length
          ? splitTextByBiblePlaceNames(slice, placeMatchList)
          : [{ kind: "text" as const, text: slice }];
      return (
        <span key={`t-${p.a}-${p.b}-${idx}`}>
          {placeParts.map((part, pi) => {
            if (part.kind === "place") {
              const loc = bibleCatalogById?.get(part.placeId);
              return (
                <span
                  key={`pl-${p.a}-${pi}`}
                  data-place-id={part.placeId}
                  className="place-link cursor-pointer rounded-sm border-b border-dotted border-teal-700/55 text-teal-900 hover:bg-teal-100/60"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    useReaderPlaceMapStore.getState().openPlace({
                      placeId: part.placeId,
                      placeName: loc?.name ?? part.text,
                      description: loc?.description ?? null,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      useReaderPlaceMapStore.getState().openPlace({
                        placeId: part.placeId,
                        placeName: loc?.name ?? part.text,
                        description: loc?.description ?? null,
                      });
                    }
                  }}
                >
                  {part.text}
                </span>
              );
            }
            const bits = part.text.split(/(\s+)/);
            return (
              <span key={`tx-${p.a}-${pi}`}>
                {bits.map((bit, j) => {
                  if (/^\s+$/.test(bit)) {
                    return <span key={j}>{bit}</span>;
                  }
                  const w = stripWordPunct(bit);
                  if (!w) return <span key={j}>{bit}</span>;
                  return (
                    <button
                      key={j}
                      type="button"
                      className="inline border-0 bg-transparent p-0 font-[inherit] text-inherit underline decoration-dotted decoration-neutral-400 underline-offset-2 hover:bg-amber-100/60"
                      onClick={(e) => {
                        e.preventDefault();
                        setWordModal({ word: w, verse });
                      }}
                    >
                      {bit}
                    </button>
                  );
                })}
              </span>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl" onMouseUp={onMouseUp}>
      {saveMsg ? (
        <p className="mb-3 text-center text-xs text-neutral-600">
          {saveMsg}{" "}
          <Link to="/word-study" className="font-medium text-primary underline-offset-2 hover:underline">
            Open word studies
          </Link>
        </p>
      ) : null}

      {toolbar && selRange ? (
        <div
          className="pointer-events-auto fixed z-40 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white px-2 py-1 shadow-lg"
          style={{ top: toolbar.top, left: toolbar.left }}
        >
          <Button type="button" size="sm" variant="secondary" onClick={() => void saveHighlight()}>
            Highlight
          </Button>
        </div>
      ) : null}

      <div className="flex gap-6">
        <div className="flex w-8 shrink-0 flex-col items-center gap-4 pt-1">
          {jumpMarks.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => scrollToVerse(v)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-medium text-neutral-600 hover:bg-neutral-300"
            >
              {v}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          {verses.map((row) => {
            const fm = flowMapByVerse?.[String(row.verse)];
            const hasFlowInfo = hasFlowMapInfo(fm);
            return (
            <div key={row.verse} id={`kairos-verse-${row.verse}`} className="group flex gap-3 scroll-mt-24">
              <div className="flex w-7 shrink-0 flex-col items-end gap-0.5 pt-0.5">
                <span className="text-right text-xs font-medium text-neutral-400">{row.verse}</span>
                {hasFlowInfo && fm && onToggleSermonMapForVerse ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex rounded p-0.5 text-amber-800/80 hover:bg-amber-100"
                      aria-label="Toggle sermon map panel for this verse"
                      title={flowHoverLabel(fm)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSermonMapForVerse(row.verse, fm);
                      }}
                    >
                      <GitBranch className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </button>
                    <div className="pointer-events-none absolute left-6 top-0 z-20 hidden w-56 rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[10px] text-neutral-700 shadow-md group-hover:block">
                      <p className="font-semibold text-neutral-900">Verse flow</p>
                      <p className="mt-0.5 truncate">To: {fm.leads_to.length ? fm.leads_to.map((x) => x.ref_label).join(", ") : "none"}</p>
                      <p className="truncate">From: {fm.led_from.length ? fm.led_from.map((x) => x.ref_label).join(", ") : "none"}</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                {row.section_title ? (
                  <p className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-500">
                    {row.section_title}
                  </p>
                ) : null}
                <p
                  ref={(el) => {
                    verseRootRefs.current.set(row.verse, el);
                  }}
                  className="select-text font-serif leading-[1.75] text-neutral-800"
                  style={{ fontSize: `${fontPx}px` }}
                >
                  {renderVerseInner(row.text, row.verse)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => openNote(row.verse)}>
                    Note
                  </Button>
                  {(notesByVerse.get(row.verse) ?? []).map((n) => (
                    <span key={n.id} className="max-w-full truncate rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
                      {n.body.slice(0, 80)}
                      {n.body.length > 80 ? "…" : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {wordModal ? (
        <Modal open onClose={() => setWordModal(null)} title={`“${wordModal.word}”`} wide>
          <p className="text-xs text-muted-foreground">
            {book} {chapter}:{wordModal.verse} · {translation}
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {blbInterlinearUrl(book, chapter, wordModal.verse, translation) ? (
              <a
                className="text-primary underline-offset-2 hover:underline"
                href={blbInterlinearUrl(book, chapter, wordModal.verse, translation)!}
                target="_blank"
                rel="noreferrer"
              >
                Blue Letter Bible — this verse (interlinear &amp; tools)
              </a>
            ) : null}
            <a className="text-primary underline-offset-2 hover:underline" href={blbSearchUrl(wordModal.word)} target="_blank" rel="noreferrer">
              Blue Letter Bible — search “{wordModal.word}”
            </a>
            <a className="text-primary underline-offset-2 hover:underline" href={blbLexiconHubUrl()} target="_blank" rel="noreferrer">
              Greek &amp; Hebrew lexicons (BLB)
            </a>
            <a className="text-primary underline-offset-2 hover:underline" href={blbConcordanceUrl()} target="_blank" rel="noreferrer">
              Strong’s concordance (BLB)
            </a>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setWordModal(null)}>
              Close
            </Button>
            <Button type="button" onClick={() => void saveWordStudy()} style={{ backgroundColor: JBCH_ORANGE }} className="text-white">
              Save to dictionary
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Dictionary cards store BLB links and this verse. Add Strong’s from BLB later to extend cross-references.
          </p>
        </Modal>
      ) : null}

      {noteModal ? (
        <Modal open onClose={() => setNoteModal(null)} title={`Note · ${book} ${chapter}:${noteModal.verse}`}>
          <textarea
            value={noteModal.body}
            onChange={(e) => setNoteModal({ ...noteModal, body: e.target.value })}
            className="apple-field min-h-[8rem] w-full resize-y"
            placeholder="Your note for this verse…"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setNoteModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveNote()} disabled={!noteModal.body.trim()}>
              Save
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
