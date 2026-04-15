import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GitBranch } from "lucide-react";

import { ScriptureCrossLinksBlock } from "@/components/scripture/ScriptureCrossLinksBlock";
import { PersonFamilyTreeModal } from "@/components/timeline/PersonFamilyTreeModal";
import {
  groupScriptureAppearancesForDisplay,
  normalizeScriptureAppearances,
  type LoreCardKind,
  type PersonProfile,
} from "@/lib/timelinePeople";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import { toYearLabel } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";

const ACCENT = "#9f1239";
const ACCENT_SOFT = "#fce7f3";

const KIND_LABEL: Record<LoreCardKind, string> = {
  item: "Items & relics",
  clothing: "Clothing & regalia",
  place: "Places",
  event: "Life events",
};

function groupLoreCards(cards: NonNullable<PersonProfile["loreCards"]>) {
  const order: LoreCardKind[] = ["item", "clothing", "place", "event"];
  const map = new Map<LoreCardKind, typeof cards>();
  for (const k of order) map.set(k, []);
  for (const c of cards) {
    const list = map.get(c.kind) ?? [];
    list.push(c);
    map.set(c.kind, list);
  }
  return order.map((k) => ({ kind: k, items: map.get(k) ?? [] })).filter((g) => g.items.length > 0);
}

export function PersonLorePanel({
  event,
  profile,
  onNavigateAway,
  className = "",
  /** Full-route lore page (`/timeline/person/…`); slightly narrower portrait. Reader modal omits this. */
  standalonePage = false,
}: {
  event: TimelineEvent;
  profile: PersonProfile;
  /** Called when following an in-panel navigation link (e.g. modal close). */
  onNavigateAway?: () => void;
  className?: string;
  standalonePage?: boolean;
}) {
  const [familyTreeOpen, setFamilyTreeOpen] = useState(false);
  const name = profile.name || event.title;
  const cards = profile.loreCards ?? [];
  const callouts = profile.loreCallouts ?? [];
  const appearances = normalizeScriptureAppearances(profile.scriptureAppearances ?? []);
  const footprintDisplay = useMemo(() => groupScriptureAppearancesForDisplay(appearances), [appearances]);
  const grouped = groupLoreCards(cards.length ? cards : []);
  const uniqueBooks = [...new Set(appearances.map((a) => a.book).filter(Boolean))] as string[];
  uniqueBooks.sort((a, b) => {
    const ia = ALL_BIBLE_BOOKS.indexOf(a);
    const ib = ALL_BIBLE_BOOKS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const timelineBooksQs = uniqueBooks.map((b) => `book=${encodeURIComponent(b)}`).join("&");
  const hasLoreGroups = grouped.length > 0;

  return (
    <div className={`font-serif text-neutral-900 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-10 lg:px-16 xl:px-20" style={{ backgroundColor: ACCENT }}>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">Codex entry</p>
          {profile.title ? <p className="mt-1 text-sm text-white/90">{profile.title}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 text-right text-xs text-white/90">
          <span>
            {event.start_year != null ? toYearLabel(event.start_year) : "?"}
            {event.end_year != null ? ` — ${toYearLabel(event.end_year)}` : ""}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded border border-white/40 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10"
              onClick={() => setFamilyTreeOpen(true)}
            >
              <GitBranch className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              Family tree
            </button>
            <Link
              to={timelineBooksQs ? `/timeline?${timelineBooksQs}` : "/timeline"}
              className="rounded border border-white/40 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10"
              onClick={() => onNavigateAway?.()}
            >
              View on timeline
            </Link>
          </div>
        </div>
      </div>

      <PersonFamilyTreeModal
        open={familyTreeOpen}
        onClose={() => setFamilyTreeOpen(false)}
        centerEvent={event}
        centerProfile={profile}
      />

      <div className="w-full px-4 py-8 sm:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto flex w-full max-w-none flex-col gap-10 xl:grid xl:grid-cols-12 xl:items-start xl:gap-12">
          <div className={`min-w-0 space-y-4 ${hasLoreGroups ? "xl:col-span-5" : "xl:col-span-12"}`}>
            <div className="text-center xl:text-left">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{name}</h2>
            </div>

            {callouts.length ? (
              <div className="space-y-2">
                {callouts.map((c, i) => (
                  <div
                    key={`co-${i}`}
                    className="rounded-lg border-2 px-3 py-2.5 text-sm text-white shadow-md"
                    style={{ backgroundColor: ACCENT, borderColor: "rgba(255,255,255,0.35)" }}
                  >
                    <p className="font-semibold">{c.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/95">{c.body}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className={`overflow-hidden rounded-xl border border-rose-900/10 bg-black shadow-lg ${
                standalonePage ? "mx-auto w-full max-w-[240px] sm:max-w-[260px] xl:max-w-[280px]" : ""
              }`}
            >
              {profile.imageDataUrl ? (
                <img
                  src={profile.imageDataUrl}
                  alt=""
                  className={
                    standalonePage
                      ? "aspect-[3/4] w-full max-h-[min(52vh,560px)] object-cover object-top sm:aspect-[4/5] xl:max-h-[min(70vh,640px)] xl:aspect-[3/4]"
                      : "aspect-[3/4] w-full max-h-[min(72vh,920px)] object-cover object-top sm:aspect-[4/5] xl:max-h-none xl:aspect-[3/4]"
                  }
                />
              ) : (
                <div
                  className={
                    standalonePage
                      ? "flex aspect-[3/4] min-h-[200px] w-full items-center justify-center bg-neutral-900 text-5xl text-white/90 sm:min-h-[240px] sm:text-6xl"
                      : "flex aspect-[3/4] min-h-[280px] w-full items-center justify-center bg-neutral-900 text-7xl text-white/90 sm:min-h-[360px]"
                  }
                >
                  {event.icon ?? "◆"}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-8 text-[15px] leading-relaxed">
              {profile.biography ? (
                <section>
                  <h3 className="mb-2 border-b border-rose-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                    Chronicle
                  </h3>
                  <p className="text-justify text-neutral-800">{profile.biography}</p>
                </section>
              ) : (
                <p className="text-sm italic text-neutral-500">No biography yet — use Edit profile to add one.</p>
              )}

              <section className="rounded-lg border border-rose-900/10 bg-white/80 p-3">
                <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
                  Quick facts
                </h3>
                <table className="w-full border-collapse text-left text-xs">
                  <tbody>
                    <tr className="border-b border-neutral-200 bg-neutral-100/80">
                      <th className="p-2 font-semibold">Field</th>
                      <th className="p-2 font-semibold">Detail</th>
                    </tr>
                    <tr className="border-b border-neutral-100 bg-amber-50/40">
                      <td className="p-2 text-neutral-600">Died</td>
                      <td className="p-2 text-neutral-900">{toYearLabel(profile.diedYear)}</td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="p-2 text-neutral-600">Ruled</td>
                      <td className="p-2 text-neutral-900">
                        {profile.ruledFromYear != null ? toYearLabel(profile.ruledFromYear) : "—"} —{" "}
                        {profile.ruledToYear != null ? toYearLabel(profile.ruledToYear) : "—"}
                      </td>
                    </tr>
                    <tr className="bg-amber-50/40">
                      <td className="p-2 text-neutral-600">Scope</td>
                      <td className="p-2 capitalize text-neutral-900">{(profile.scope ?? "bible").replace("_", " ")}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {appearances.length ? (
                <section>
                  <h3 className="mb-2 border-b border-rose-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                    Scripture footprint
                  </h3>
                  <div className="max-h-[min(60vh,640px)] overflow-y-auto rounded-lg border border-neutral-200 bg-white/90">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-neutral-200/80">
                          <th className="p-2 font-semibold">Book</th>
                          <th className="p-2 font-semibold">Chapter(s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {footprintDisplay.map((r, i) => (
                          <tr key={`${r.book}-${r.chapterDisplay}-${i}`} className={i % 2 ? "bg-amber-50/50" : "bg-white"}>
                            <td className="p-2">{r.book}</td>
                            <td className="p-2 tabular-nums">{r.chapterDisplay}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ScriptureCrossLinksBlock
                    className="mt-6 text-neutral-800 [&_h3]:border-rose-900/20 [&_h3]:text-rose-900"
                    passages={appearances}
                    excludeEventId={event.id}
                    title="Also tagged to these passages"
                    description="Places and timeline events in your library that reference the same book and chapter."
                  />
                </section>
              ) : null}
            </div>
          </div>

          {hasLoreGroups ? (
            <div className="min-w-0 space-y-8 text-[15px] leading-relaxed xl:col-span-7">
              {grouped.map(({ kind, items }) => (
                <section key={kind}>
                  <h3 className="mb-2 border-b border-rose-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                    {KIND_LABEL[kind]}
                  </h3>
                  <div className="space-y-3">
                    {items.map((card, i) => (
                      <article
                        key={`${kind}-${i}`}
                        className="flex gap-3 rounded-lg border border-rose-900/10 bg-white/90 p-3 shadow-sm"
                        style={{ boxShadow: `0 2px 12px ${ACCENT_SOFT}` }}
                      >
                        <div className="shrink-0">
                          {card.imageDataUrl ? (
                            <img
                              src={card.imageDataUrl}
                              alt=""
                              className="h-14 w-14 rounded-full border border-rose-900/15 object-cover object-center sm:h-16 sm:w-16"
                            />
                          ) : profile.imageDataUrl ? (
                            <img
                              src={profile.imageDataUrl}
                              alt=""
                              className="h-14 w-14 rounded-full border border-rose-900/15 object-cover object-top sm:h-16 sm:w-16"
                            />
                          ) : (
                            <div
                              className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-900/15 bg-neutral-100 text-xl text-neutral-600 sm:h-16 sm:w-16 sm:text-2xl"
                              aria-hidden
                            >
                              {event.icon ?? "◆"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-neutral-900">{card.title}</h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{card.body}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
