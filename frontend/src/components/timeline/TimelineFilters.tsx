import { useTimelineStore, type LayerKey } from "@/store/timelineStore";

const layers: { key: LayerKey; label: string; hint: string }[] = [
  { key: "showBible", label: "Bible", hint: "Scripture & biblical events" },
  { key: "showWorld", label: "World", hint: "Empires & rulers" },
  { key: "showPersonal", label: "My life", hint: "Milestones & journal on timeline" },
];

export function TimelineFilters() {
  const showBible = useTimelineStore((s) => s.showBible);
  const showWorld = useTimelineStore((s) => s.showWorld);
  const showPersonal = useTimelineStore((s) => s.showPersonal);
  const setLayer = useTimelineStore((s) => s.setLayer);

  const state = { showBible, showWorld, showPersonal };
  const noneOn = !showBible && !showWorld && !showPersonal;

  return (
    <div className="flex flex-col gap-2">
      {noneOn ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Turn on <span className="font-medium text-foreground">Bible</span>, <span className="font-medium text-foreground">World</span>, or{" "}
          <span className="font-medium text-foreground">My life</span> to show events on the chart.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
      {layers.map(({ key, label, hint }) => (
        <label
          key={key}
          title={hint}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-muted/25 px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-200 ease-out hover:border-primary/20 hover:bg-white hover:shadow-sm"
        >
          <input
            type="checkbox"
            className="size-3.5 rounded border-input accent-primary"
            checked={state[key]}
            onChange={(e) => setLayer(key, e.target.checked)}
          />
          {label}
        </label>
      ))}
      </div>
    </div>
  );
}
