import { Link } from "react-router-dom";

import { ScriptureCrossLinksBlock } from "@/components/scripture/ScriptureCrossLinksBlock";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import type { PlaceRecord } from "@/lib/places";
import { toYearLabel } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";

const ACCENT = "#0f766e";
const ACCENT_SOFT = "#ccfbf1";

export function PlaceLorePanel({
  place,
  relatedEvents,
  className = "",
}: {
  place: PlaceRecord;
  relatedEvents: TimelineEvent[];
  className?: string;
}) {
  const appearances = place.scriptureAppearances ?? [];
  const uniqueBooks = [...new Set(appearances.map((a) => a.book))];
  uniqueBooks.sort((a, b) => {
    const ia = ALL_BIBLE_BOOKS.indexOf(a);
    const ib = ALL_BIBLE_BOOKS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const timelineBooksQs = uniqueBooks.map((b) => `book=${encodeURIComponent(b)}`).join("&");

  return (
    <div className={`font-serif text-neutral-900 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-10 lg:px-16 xl:px-20" style={{ backgroundColor: ACCENT }}>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">Sacred place</p>
          <h2 className="mt-1 font-sans text-lg font-semibold tracking-tight text-white sm:text-xl">{place.name}</h2>
          {place.region ? <p className="mt-1 font-sans text-xs text-white/85">{place.region}</p> : null}
        </div>
        <Link
          to={`/timeline${timelineBooksQs ? `?${timelineBooksQs}` : ""}`}
          className="shrink-0 rounded border border-white/40 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10"
        >
          View on timeline
        </Link>
      </div>

      <div className="w-full px-4 py-8 sm:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto flex w-full max-w-none flex-col gap-10 xl:grid xl:grid-cols-12 xl:items-start xl:gap-12">
          <div className="space-y-4 xl:col-span-4">
            <div className="overflow-hidden rounded-xl border border-teal-900/15 bg-black shadow-lg xl:sticky xl:top-4">
              {place.imageDataUrl ? (
                <img src={place.imageDataUrl} alt="" className="aspect-[4/3] w-full max-h-[min(72vh,920px)] object-cover object-center xl:max-h-none" />
              ) : (
                <div className="flex aspect-[4/3] min-h-[220px] w-full items-center justify-center bg-neutral-900 text-6xl text-white/80">📍</div>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-8 text-[15px] leading-relaxed xl:col-span-8">
            {place.description ? (
              <section>
                <h3 className="mb-2 border-b border-teal-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                  About
                </h3>
                <p className="text-justify text-neutral-800">{place.description}</p>
              </section>
            ) : (
              <p className="text-sm italic text-neutral-500">No description yet — use Edit to add one.</p>
            )}

            {appearances.length > 0 ? (
              <section>
                <h3 className="mb-2 border-b border-teal-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                  Scripture scenes here
                </h3>
                <div className="max-h-[min(60vh,640px)] overflow-y-auto rounded-lg border border-neutral-200 bg-white/90">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-200/80">
                        <th className="p-2 font-semibold">Book</th>
                        <th className="p-2 font-semibold">Chapter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...appearances]
                        .sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter)
                        .map((r, i) => (
                          <tr key={`${r.book}-${r.chapter}-${i}`} className={i % 2 ? "bg-teal-50/50" : "bg-white"}>
                            <td className="p-2">{r.book}</td>
                            <td className="p-2">{r.chapter}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <ScriptureCrossLinksBlock
                  className="mt-6 text-neutral-800 [&_h3]:border-teal-900/20 [&_h3]:text-teal-900"
                  passages={appearances}
                  excludePlaceId={place.id}
                  title="Also tagged to these passages"
                  description="People and timeline events in your library that reference the same book and chapter."
                />
              </section>
            ) : null}

            <section>
              <h3 className="mb-2 border-b border-teal-900/20 pb-1 text-lg font-semibold" style={{ color: ACCENT }}>
                Linked timeline events
              </h3>
              {relatedEvents.length === 0 ? (
                <p className="text-sm text-neutral-500">No events linked yet. Edit this place to attach narrative events from your timeline.</p>
              ) : (
                <ul className="space-y-3">
                  {relatedEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-lg border border-teal-900/10 bg-white/90 p-4 shadow-sm"
                      style={{ boxShadow: `0 2px 12px ${ACCENT_SOFT}` }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{ev.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {ev.start_year != null ? toYearLabel(ev.start_year) : "?"}
                            {ev.end_year != null ? ` — ${toYearLabel(ev.end_year)}` : ""}
                            <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase">{ev.type.replace("_", " ")}</span>
                          </p>
                          {ev.description ? <p className="mt-2 text-sm leading-relaxed text-neutral-700">{ev.description}</p> : null}
                        </div>
                        <Link
                          to={ev.type === "person" || ev.type === "ruler" ? `/timeline/person/${ev.id}` : `/timeline/event/${ev.id}`}
                          className="shrink-0 text-xs font-medium text-teal-800 underline-offset-2 hover:underline"
                        >
                          Open →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
