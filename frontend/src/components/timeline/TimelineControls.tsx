import type { ZoomLevel } from "@/types";
import { useTimelineStore } from "@/store/timelineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const levels: ZoomLevel[] = ["millennium", "century", "decade", "year", "detail"];

const ZOOM_BUTTON_LABEL: Record<ZoomLevel, string> = {
  millennium: "Millennium",
  century: "Century",
  decade: "Decade",
  year: "Year",
  detail: "Closer",
};

export function TimelineControls({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  const zoom = useTimelineStore((s) => s.zoom);
  const setZoom = useTimelineStore((s) => s.setZoom);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Zoom{" "}
          <span className="font-normal normal-case text-muted-foreground/80">(presets — wheel zooms on chart)</span>
        </p>
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 shadow-sm">
          {levels.map((z) => (
            <Button
              key={z}
              type="button"
              variant={zoom === z ? "default" : "ghost"}
              size="sm"
              className={cn(zoom === z ? "shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setZoom(z)}
            >
              {ZOOM_BUTTON_LABEL[z]}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-xs space-y-2">
        <label htmlFor="kairos-timeline-search" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Search timeline
        </label>
        <Input
          id="kairos-timeline-search"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Fuzzy search titles…"
          className="bg-background/80"
        />
      </div>
      <Separator className="sm:hidden" />
    </div>
  );
}
