import type { TimelineEvent } from "@/types";
import { eventStartYear } from "@/lib/timelineMath";

/** Vertical testimony-style list (newest toward bottom). */
export function SpiritualRiver({
  events,
  onSelect,
}: {
  events: TimelineEvent[];
  onSelect: (id: string) => void;
}) {
  const sorted = [...events].sort((a, b) => eventStartYear(a) - eventStartYear(b));
  return (
    <div className="relative mx-auto max-w-lg border-l border-primary/20 pl-6">
      {sorted.map((ev) => (
        <button
          key={ev.id}
          type="button"
          onClick={() => onSelect(ev.id)}
          className="relative mb-8 block w-full rounded-xl py-1 pl-1 text-left transition-colors duration-200 ease-out hover:bg-black/[0.03]"
        >
          <span className="absolute -left-[29px] top-2 flex h-3 w-3 rounded-full border-2 border-background bg-primary shadow-sm ring-1 ring-primary/20" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{ev.type.replace("_", " ")}</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            {ev.icon ? <span className="mr-1">{ev.icon}</span> : null}
            {ev.title}
          </p>
          {ev.description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ev.description}</p> : null}
        </button>
      ))}
    </div>
  );
}
