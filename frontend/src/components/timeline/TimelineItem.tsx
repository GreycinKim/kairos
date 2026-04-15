import clsx from "clsx";

import type { TimelineEvent } from "@/types";

interface TimelineItemProps {
  event: TimelineEvent;
  left: number;
  width: number;
  top: number;
  height: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function TimelineItemBar({
  event,
  left,
  width,
  top,
  height,
  selected,
  onSelect,
}: TimelineItemProps) {
  const bg = event.color ?? "#64748b";
  const showLabel = width > 56;
  const subtitle = [event.era, event.author].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      title={`${event.title}${subtitle ? ` — ${subtitle}` : ""}`}
      className={clsx(
        "absolute flex items-center overflow-hidden rounded-md border border-black/15 px-1 text-left text-[10px] font-medium leading-tight shadow-sm transition-all duration-200 ease-out hover:z-20 hover:ring-2 hover:ring-primary/35",
        selected ? "z-10 ring-2 ring-primary" : "",
      )}
      style={{
        left,
        width: Math.max(width, 6),
        top,
        height,
        backgroundColor: `${bg}cc`,
        color: "#0f172a",
      }}
      onClick={() => onSelect(event.id)}
    >
      <span className="mr-0.5 shrink-0" aria-hidden>
        {event.icon ?? "·"}
      </span>
      {showLabel ? <span className="truncate">{event.title}</span> : null}
    </button>
  );
}
