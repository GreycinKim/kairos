import { Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ZOOM_PX, useTimelineStore } from "@/store/timelineStore";

const PX_MIN = Math.min(...Object.values(ZOOM_PX));
const PX_MAX = Math.max(...Object.values(ZOOM_PX));

function MagnifierIcon() {
  return (
    <svg className="h-6 w-6 shrink-0 text-primary/70" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Horizontal drag adjusts zoom; lives above the scrollable timeline so pan and zoom do not fight. */
function ZoomDragRail() {
  const pxPerYear = useTimelineStore((s) => s.pxPerYear);
  const setPxPerYearLive = useTimelineStore((s) => s.setPxPerYearLive);
  const commitPxPerYearZoom = useTimelineStore((s) => s.commitPxPerYearZoom);
  const dragStart = useRef<{ x: number; px: number } | null>(null);

  const thumbLeft = `${((pxPerYear - PX_MIN) / (PX_MAX - PX_MIN)) * 100}%`;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = { x: e.clientX, px: pxPerYear };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = dragStart.current;
      if (!s) return;
      setPxPerYearLive(s.px + (e.clientX - s.x) * 0.038);
    },
    [setPxPerYearLive],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStart.current) {
        dragStart.current = null;
        commitPxPerYearZoom();
      }
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [commitPxPerYearZoom],
  );

  const rail = (
    <div
      role="slider"
      aria-valuemin={PX_MIN}
      aria-valuemax={PX_MAX}
      aria-valuenow={pxPerYear}
      aria-label="Drag horizontally to zoom the timeline"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative mx-2 mb-2 cursor-ew-resize touch-none select-none rounded-full border border-border bg-muted/40 px-3 py-2 shadow-inner transition-colors duration-200 ease-out hover:bg-muted/55"
    >
      <div className="pointer-events-none flex justify-between text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Zoom out</span>
        <span>Drag ↔ to zoom</span>
        <span>Zoom in</span>
      </div>
      <div className="pointer-events-none relative mx-6 mt-2 h-1.5 rounded-full bg-muted">
        <div
          className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-primary shadow-sm ring-1 ring-background transition-[left] duration-150 ease-out"
          style={{ left: thumbLeft }}
        />
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block w-full">{rail}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center">
        Drag to adjust zoom; release to snap to the nearest preset. On the chart, use the scroll wheel or a two-finger pinch toward the focal point.
      </TooltipContent>
    </Tooltip>
  );
}

function BrandTitle({ word, compact }: { word: string; compact?: boolean }) {
  return (
    <h2
      className={cn(
        "select-none text-center font-sans font-semibold tracking-tight text-foreground",
        compact ? "text-3xl sm:text-4xl" : "text-5xl sm:text-6xl",
      )}
    >
      {word}
    </h2>
  );
}

function TimelineFloatingChrome({
  brandWord,
  tagline,
  children,
  onSearchFocus,
  onJumpToday,
  showSearchButton,
}: {
  brandWord: string;
  tagline?: string;
  children: ReactNode;
  onSearchFocus?: () => void;
  onJumpToday?: () => void;
  showSearchButton?: boolean;
}) {
  const fsRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsFs(document.fullscreenElement === fsRef.current);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = fsRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* unsupported or denied */
    }
  }, []);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[min(100%,52rem)] flex-1 flex-col justify-center px-4 py-2 sm:max-w-[min(100%,60rem)] sm:px-8">
      <div className={cn("flex shrink-0 flex-col items-center gap-1.5", tagline ? "pb-3" : "pb-2")}>
        <BrandTitle word={brandWord} compact />
        {tagline ? (
          <p className="line-clamp-2 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {tagline}
          </p>
        ) : null}
      </div>

      <div
        ref={fsRef}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#f6f4ef] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.06] sm:rounded-[1.35rem] sm:shadow-[0_32px_80px_-24px_rgba(0,0,0,0.22)]"
      >
        <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pt-3 sm:px-4">
          <ZoomDragRail />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-1 sm:px-3 sm:pb-3">
          {children}
        </div>

        <div className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-black/[0.06] bg-[#f4f1ea]/95 px-3 py-3 sm:gap-3">
          {showSearchButton ? (
            <Button type="button" variant="outline" size="default" className="shadow-sm sm:min-w-[10rem]" onClick={onSearchFocus}>
              Search timeline
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="default" className="shadow-sm sm:min-w-[10rem]" onClick={onJumpToday}>
            Jump to today
          </Button>
          <Button type="button" variant="outline" size="default" className="shadow-sm sm:min-w-[10rem]" onClick={() => void toggleFullscreen()}>
            {isFs ? (
              <>
                <Minimize2 className="mr-1.5 h-4 w-4" strokeWidth={2} aria-hidden />
                Exit fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="mr-1.5 h-4 w-4" strokeWidth={2} aria-hidden />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TimelineSearchChrome({
  children,
  brandWord = "Kairos",
  tagline,
  onSearchFocus,
  onJumpToday,
  showSearchButton = true,
  /** Timeline + chrome grow to fill remaining viewport height and use full main width. */
  fillViewport = false,
  /** `floating`: centered strip with soft shadow — no outer card or side chrome. */
  variant = "framed",
}: {
  children: ReactNode;
  brandWord?: string;
  tagline?: string;
  onSearchFocus?: () => void;
  onJumpToday?: () => void;
  showSearchButton?: boolean;
  fillViewport?: boolean;
  variant?: "framed" | "floating";
}) {
  if (fillViewport) {
    if (variant === "floating") {
      return (
        <TimelineFloatingChrome
          brandWord={brandWord}
          tagline={tagline}
          onSearchFocus={onSearchFocus}
          onJumpToday={onJumpToday}
          showSearchButton={showSearchButton}
        >
          {children}
        </TimelineFloatingChrome>
      );
    }

    return (
      <div className="mx-auto flex h-full min-h-0 w-full max-w-none flex-1 flex-col px-0">
        <div className={cn("flex shrink-0 flex-col items-center gap-2", tagline ? "pb-4" : "pb-3")}>
          <BrandTitle word={brandWord} compact />
          {tagline ? (
            <p className="line-clamp-3 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">{tagline}</p>
          ) : null}
        </div>

        <Card
          className={cn(
            "group relative flex min-h-0 flex-1 flex-col overflow-hidden border-black/[0.06] py-3 pl-4 pr-3 shadow-float sm:py-4 sm:pl-5 sm:pr-4",
            "rounded-2xl sm:rounded-3xl",
          )}
        >
          <div className="relative z-10 flex min-h-0 flex-1 items-stretch gap-3 sm:gap-4">
            <div className="flex shrink-0 items-start pt-1 sm:pt-2">
              <MagnifierIcon />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0">
                <ZoomDragRail />
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f6f4ef] shadow-inner transition-shadow duration-200 ease-out">
                {children}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-4 flex shrink-0 flex-wrap justify-center gap-3 sm:mt-5">
          {showSearchButton ? (
            <Button type="button" variant="outline" size="default" className="shadow-sm sm:min-w-[10rem]" onClick={onSearchFocus}>
              Search timeline
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="default" className="shadow-sm sm:min-w-[10rem]" onClick={onJumpToday}>
            Jump to today
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-2">
      <div className="mb-8 flex flex-col items-center gap-2">
        <BrandTitle word={brandWord} />
        {tagline ? <p className="max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">{tagline}</p> : null}
      </div>

      <Card className="group relative w-full overflow-hidden rounded-3xl border-black/[0.06] py-4 pl-5 pr-4 shadow-float">
        <div className="relative z-10 flex items-stretch gap-4">
          <div className="flex shrink-0 items-start pt-2">
            <MagnifierIcon />
          </div>
          <div className="min-w-0 flex-1">
            <ZoomDragRail />
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#f6f4ef] shadow-inner">{children}</div>
          </div>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {showSearchButton ? (
          <Button type="button" variant="outline" size="lg" className="min-w-[10rem] shadow-sm" onClick={onSearchFocus}>
            Search timeline
          </Button>
        ) : null}
        <Button type="button" variant="secondary" size="lg" className="min-w-[10rem] shadow-sm" onClick={onJumpToday}>
          Jump to today
        </Button>
      </div>
    </div>
  );
}
