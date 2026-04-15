import clsx from "clsx";

import type { TimelineEvent } from "@/types";

export const CARD_H = 56;
export const DIAMOND = 9;

function cardSubtitle(ev: TimelineEvent): string {
  if (ev.start_date) {
    const end = ev.end_date && ev.end_date !== ev.start_date ? ` – ${ev.end_date}` : "";
    return `${ev.start_date}${end}`;
  }
  if (ev.start_year != null) {
    const a = ev.start_year <= 0 ? `${Math.abs(ev.start_year)} BC` : `${ev.start_year} AD`;
    if (ev.end_year != null && ev.end_year !== ev.start_year) {
      const b = ev.end_year <= 0 ? `${Math.abs(ev.end_year)} BC` : `${ev.end_year} AD`;
      return `${a} — ${b}`;
    }
    return `(${a})`;
  }
  if (ev.era) return ev.era;
  return ev.type.replace("_", " ");
}

/** Franklin-style: white card, dashed connector, blue diamond on the axis (absolute canvas coords). */
export function TimelineEventBubble({
  event,
  avatarUrl,
  anchorX,
  railY,
  centerY,
  side,
  selected,
  onActivate,
}: {
  event: TimelineEvent;
  avatarUrl?: string | null;
  anchorX: number;
  railY: number;
  centerY: number;
  side: "above" | "below";
  selected: boolean;
  onActivate: () => void;
}) {
  const cardTop = centerY - CARD_H / 2;
  const cardBottom = centerY + CARD_H / 2;

  const lineTop = side === "above" ? cardBottom : railY + DIAMOND / 2;
  const lineHeight =
    side === "above"
      ? Math.max(4, railY - DIAMOND / 2 - lineTop)
      : Math.max(4, cardTop - lineTop);

  const diamond = (
    <div
      className="pointer-events-none absolute z-[9] rotate-45 rounded-[1px] border border-[#163a66] bg-[#1e4070] shadow-sm"
      style={{
        left: anchorX - DIAMOND / 2,
        top: railY - DIAMOND / 2,
        width: DIAMOND,
        height: DIAMOND,
      }}
      aria-hidden
    />
  );

  const line = (
    <div
      className="pointer-events-none absolute z-[8] w-0 -translate-x-1/2"
      style={{
        left: anchorX,
        top: lineTop,
        height: lineHeight,
        borderLeft: "1px dashed #b0aaa0",
      }}
    />
  );

  const card = (
    <button
      type="button"
      title={event.title}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className={clsx(
        "absolute z-20 max-w-[220px] rounded-sm border bg-white px-2.5 py-2 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4070]",
        selected ? "border-[#1e4070] ring-2 ring-[#1e4070]/30" : "border-black",
      )}
      style={{
        left: anchorX,
        top: cardTop,
        transform: "translateX(-50%)",
        minWidth: 132,
        minHeight: CARD_H,
      }}
    >
      <div className="flex gap-2">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-neutral-300 object-cover" />
        ) : (
          <span className="shrink-0 text-xl leading-none text-neutral-800" aria-hidden>
            {event.icon ?? "◆"}
          </span>
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-neutral-900">{event.title}</p>
          <p className="mt-0.5 truncate text-[9px] text-neutral-600">{cardSubtitle(event)}</p>
        </div>
      </div>
    </button>
  );

  return side === "above" ? (
    <>
      {card}
      {line}
      {diamond}
    </>
  ) : (
    <>
      {diamond}
      {line}
      {card}
    </>
  );
}

export function TimelineEraBubble({
  label,
  left,
  top,
  onActivate,
}: {
  label: string;
  left: number;
  top: number;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      className="absolute z-[12] max-w-[120px] -translate-x-1/2 truncate rounded-sm border border-neutral-400/80 bg-white/95 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-neutral-700 shadow-sm hover:border-[#1e4070] hover:text-[#1e4070]"
      style={{ left, top }}
    >
      {label}
    </button>
  );
}
