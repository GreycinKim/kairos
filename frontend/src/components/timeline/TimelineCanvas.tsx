import {
  Fragment,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";

import type { TimelineEvent } from "@/types";
import { cn } from "@/lib/utils";
import {
  ERA_BANDS,
  TIMELINE_MAX_YEAR,
  TIMELINE_MIN_YEAR,
  eventEndYear,
  eventStartYear,
  todayFractionalYear,
  writtenMidYear,
  yearToX,
} from "@/lib/timelineMath";
import { buildTicks } from "@/lib/timelineTicks";
import { maxLaneDepth, packEventBubbles } from "@/lib/timelineBubbleLayout";
import {
  TIMELINE_PX_MAX,
  TIMELINE_PX_MIN,
  filterEventsByLayer,
  filterSpiritualOnly,
  useTimelineStore,
} from "@/store/timelineStore";

import { CARD_H, TimelineEraBubble, TimelineEventBubble } from "./TimelineBubble";

const HEADER_H = 16;
const LANE_STEP = 64;
const STEM = 14;
const BOTTOM_AXIS = 40;
const AXIS_BLUE = "#1e4070";
const CANVAS_BG = "#f4f1ea";

/** Vertical gap between stacked span bars (when ranges overlap in time). */
const SPAN_ROW_TOP = 6;
const SPAN_ROW_STEP = 8;
const SPAN_STACK_TAIL = 6;
const SPAN_BELOW_GAP = 10;

interface TimelineCanvasProps {
  events: TimelineEvent[];
  mode?: "unified" | "spiritual";
  onEventOpen?: (eventId: string) => void;
  getAvatarUrl?: (eventId: string) => string | null;
  /** When true, stretch the scroll strip to fill parent height (use with flex layout). */
  fillHeight?: boolean;
}

export type TimelineCanvasHandle = {
  scrollToToday: () => void;
  scrollToYear: (year: number) => void;
};

function formatTickYear(y: number): string {
  const yi = Math.round(y);
  if (yi <= 0) return `${Math.abs(yi)} BC`;
  return `${yi} AD`;
}

export const TimelineCanvas = forwardRef<TimelineCanvasHandle, TimelineCanvasProps>(
  function TimelineCanvas({ events, mode = "unified", onEventOpen, getAvatarUrl, fillHeight = false }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const pxPerYear = useTimelineStore((s) => s.pxPerYear);
    const selectedEventId = useTimelineStore((s) => s.selectedEventId);
    const selectEvent = useTimelineStore((s) => s.selectEvent);
    const showBible = useTimelineStore((s) => s.showBible);
    const showWorld = useTimelineStore((s) => s.showWorld);
    const showPersonal = useTimelineStore((s) => s.showPersonal);

    const minY = TIMELINE_MIN_YEAR;
    const maxY = TIMELINE_MAX_YEAR;
    const totalWidth = (maxY - minY) * pxPerYear;

    const spiritual = mode === "spiritual";
    const layers = useMemo(
      () => ({ showBible, showWorld, showPersonal }),
      [showBible, showWorld, showPersonal],
    );

    const filtered = useMemo(() => {
      let list = spiritual ? events.filter(filterSpiritualOnly) : events;
      if (!spiritual) {
        list = list.filter((ev) => filterEventsByLayer(ev, layers));
      }
      return list;
    }, [events, spiritual, layers]);

    const spanLayout = useMemo(() => {
      const items = filtered.map((ev) => {
        const sy = eventStartYear(ev);
        const ey = Math.max(eventEndYear(ev), sy + 0.25);
        const x0 = yearToX(sy, minY, pxPerYear);
        const x1 = Math.max(yearToX(ey, minY, pxPerYear), x0 + 2);
        return { id: ev.id, x0, x1 };
      });
      items.sort((a, b) => a.x0 - b.x0 || a.x1 - b.x1);
      const rowEnd: number[] = [];
      const byId = new Map<string, number>();
      for (const it of items) {
        let r = 0;
        while (r < rowEnd.length && rowEnd[r]! > it.x0 + 0.25) r++;
        if (r === rowEnd.length) rowEnd.push(it.x1);
        else rowEnd[r] = Math.max(rowEnd[r]!, it.x1);
        byId.set(it.id, r);
      }
      const maxRow = items.length === 0 ? -1 : Math.max(...byId.values());
      return { byId, maxRow };
    }, [filtered, minY, pxPerYear]);

    const minGapPx = Math.max(48, Math.min(100, 560 / pxPerYear));

    const placements = useMemo(
      () => packEventBubbles(filtered, minY, pxPerYear, minGapPx),
      [filtered, minY, pxPerYear, minGapPx],
    );

    const maxAbove = maxLaneDepth(placements, "above");
    const maxBelow = maxLaneDepth(placements, "below");

    const railY = HEADER_H + maxAbove * LANE_STEP + STEM + CARD_H;

    const spanRowCount = spanLayout.maxRow < 0 ? 0 : spanLayout.maxRow + 1;
    const spanStackBottom = railY + SPAN_ROW_TOP + spanRowCount * SPAN_ROW_STEP + SPAN_STACK_TAIL;
    const legacyBelowFirst = railY + STEM + CARD_H / 2;
    const belowFirstCenter = Math.max(legacyBelowFirst, spanStackBottom + SPAN_BELOW_GAP + STEM + CARD_H / 2);

    const lowestBelowCenter =
      maxBelow === 0 ? belowFirstCenter : belowFirstCenter + (maxBelow - 1) * LANE_STEP;
    const bottomMost = lowestBelowCenter + CARD_H / 2 + 20;

    const tickBandTop = bottomMost + 4;
    const totalHeight = tickBandTop + BOTTOM_AXIS;

    const ticks = useMemo(() => buildTicks(minY, maxY, pxPerYear), [minY, maxY, pxPerYear]);

    const bubbleCenterY = useCallback(
      (side: "above" | "below", lane: number) => {
        if (side === "above") {
          return railY - STEM - CARD_H / 2 - lane * LANE_STEP;
        }
        return belowFirstCenter + lane * LANE_STEP;
      },
      [railY, belowFirstCenter],
    );

    const todayX = yearToX(todayFractionalYear(), minY, pxPerYear);
    const showToday = spiritual || showPersonal;

    const scrollToYear = useCallback(
      (year: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const x = yearToX(year, minY, pxPerYear);
        el.scrollLeft = Math.max(0, Math.min(x - el.clientWidth * 0.5, el.scrollWidth - el.clientWidth));
      },
      [minY, pxPerYear],
    );

    const scrollToToday = useCallback(() => {
      scrollToYear(todayFractionalYear());
    }, [scrollToYear]);

    /** Initial view only — do not re-center on zoom (would fight cursor-anchored wheel zoom). */
    const didInitialScroll = useRef(false);
    useLayoutEffect(() => {
      if (didInitialScroll.current) return;
      didInitialScroll.current = true;
      scrollToToday();
    }, [scrollToToday]);

    /** Maps-style: wheel zooms toward pointer; drag pans. */
    useLayoutEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      let zoomUiTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleZoomUiSync = () => {
        if (zoomUiTimer) clearTimeout(zoomUiTimer);
        zoomUiTimer = setTimeout(() => {
          zoomUiTimer = null;
          useTimelineStore.getState().syncZoomUiOnly();
        }, 200);
      };

      const scaleWheelDelta = (ev: WheelEvent, rect: DOMRect) => {
        let dy = ev.deltaY;
        let dx = ev.deltaX;
        if (ev.deltaMode === 1) {
          dy *= 16;
          dx *= 16;
        } else if (ev.deltaMode === 2) {
          dy *= rect.height;
          dx *= rect.width;
        }
        return { dx, dy };
      };

      const onWheel = (e: WheelEvent) => {
        const zoomIntent = e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (!zoomIntent) {
          e.preventDefault();
          const rect = el.getBoundingClientRect();
          const { dx, dy } = scaleWheelDelta(e, rect);
          if (Math.abs(dx) >= Math.abs(dy)) {
            el.scrollLeft += dx;
          } else {
            el.scrollTop += dy;
          }
          return;
        }
        e.preventDefault();

        const rect = el.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const pxOld = useTimelineStore.getState().pxPerYear;
        const yearAtCursor = minY + (el.scrollLeft + localX) / pxOld;

        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= rect.height;

        const sensitivity = 0.0016;
        const factor = Math.exp(-delta * sensitivity);
        const pxNew = Math.min(TIMELINE_PX_MAX, Math.max(TIMELINE_PX_MIN, pxOld * factor));
        if (Math.abs(pxNew - pxOld) < 1e-8) return;

        useTimelineStore.getState().setPxPerYearLive(pxNew);
        const targetScroll = (yearAtCursor - minY) * pxNew - localX;
        requestAnimationFrame(() => {
          const sc = scrollRef.current;
          if (!sc) return;
          sc.scrollLeft = Math.max(0, Math.min(targetScroll, sc.scrollWidth - sc.clientWidth));
        });
        scheduleZoomUiSync();
      };

      const pan = {
        active: false,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
        pointerId: 0,
      };

      const pointers = new Map<number, { x: number; y: number }>();
      let pinchPrevDist: number | null = null;

      const pinchMetrics = () => {
        if (pointers.size < 2) return null;
        const vals = [...pointers.values()];
        const a = vals[0];
        const b = vals[1];
        if (!a || !b) return null;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < 4) return null;
        return { dist, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
      };

      const applyPinchZoom = (scale: number, midClientX: number) => {
        const rect = el.getBoundingClientRect();
        const localX = midClientX - rect.left;
        const pxOld = useTimelineStore.getState().pxPerYear;
        const pxNew = Math.min(TIMELINE_PX_MAX, Math.max(TIMELINE_PX_MIN, pxOld * scale));
        if (Math.abs(pxNew - pxOld) < 1e-8) return;
        const yearAtCursor = minY + (el.scrollLeft + localX) / pxOld;
        useTimelineStore.getState().setPxPerYearLive(pxNew);
        const targetScroll = (yearAtCursor - minY) * pxNew - localX;
        requestAnimationFrame(() => {
          const sc = scrollRef.current;
          if (!sc) return;
          sc.scrollLeft = Math.max(0, Math.min(targetScroll, sc.scrollWidth - sc.clientWidth));
        });
        scheduleZoomUiSync();
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;

        if (pointers.size === 0 && (e.target as HTMLElement).closest("button")) return;

        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size >= 2) {
          if (pan.active) {
            pan.active = false;
            el.classList.remove("cursor-grabbing");
            try {
              el.releasePointerCapture(pan.pointerId);
            } catch {
              /* */
            }
          }
          const pm = pinchMetrics();
          pinchPrevDist = pm?.dist ?? null;
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            /* */
          }
          return;
        }

        if ((e.target as HTMLElement).closest("button")) {
          pointers.delete(e.pointerId);
          return;
        }

        pan.active = true;
        pan.pointerId = e.pointerId;
        pan.startX = e.clientX;
        pan.startY = e.clientY;
        pan.startScrollLeft = el.scrollLeft;
        pan.startScrollTop = el.scrollTop;
        el.setPointerCapture(e.pointerId);
        el.classList.add("cursor-grabbing");
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size >= 2) {
          const pm = pinchMetrics();
          const prevD = pinchPrevDist;
          if (pm && prevD != null && prevD > 0) {
            const scale = pm.dist / prevD;
            pinchPrevDist = pm.dist;
            applyPinchZoom(scale, pm.midX);
          }
          return;
        }

        if (!pan.active || e.pointerId !== pan.pointerId) return;
        el.scrollLeft = pan.startScrollLeft - (e.clientX - pan.startX);
        el.scrollTop = pan.startScrollTop - (e.clientY - pan.startY);
      };

      const endPan = (e: PointerEvent) => {
        if (!pan.active || e.pointerId !== pan.pointerId) return;
        pan.active = false;
        el.classList.remove("cursor-grabbing");
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
      };

      const onPointerEnd = (e: PointerEvent) => {
        const hadPinch = pointers.size >= 2;
        pointers.delete(e.pointerId);
        if (hadPinch && pointers.size < 2) {
          pinchPrevDist = null;
          useTimelineStore.getState().syncZoomUiOnly();
        }
        endPan(e);
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerEnd);
      el.addEventListener("pointercancel", onPointerEnd);

      return () => {
        if (zoomUiTimer) clearTimeout(zoomUiTimer);
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerEnd);
        el.removeEventListener("pointercancel", onPointerEnd);
      };
    }, [minY]);

    const prevSelected = useRef<string | null>(null);
    useEffect(() => {
      if (!selectedEventId) {
        prevSelected.current = null;
        return;
      }
      if (selectedEventId === prevSelected.current) return;
      const ev = filtered.find((e) => e.id === selectedEventId);
      if (!ev) return;
      prevSelected.current = selectedEventId;

      const sy = eventStartYear(ev);
      const ey = Math.max(eventEndYear(ev), sy + 0.25);
      const mid = (sy + ey) / 2;
      const spanYears = Math.max(ey - sy, 0.25);

      const sc = scrollRef.current;
      if (sc && sc.clientWidth > 0) {
        const vw = sc.clientWidth;
        const targetPx = Math.min(TIMELINE_PX_MAX, Math.max(TIMELINE_PX_MIN, (vw * 0.42) / spanYears));
        useTimelineStore.getState().setPxPerYearLive(targetPx);
        useTimelineStore.getState().syncZoomUiOnly();
      }

      const pxNow = useTimelineStore.getState().pxPerYear;
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        const x = (mid - minY) * pxNow;
        el.scrollLeft = Math.max(0, Math.min(x - el.clientWidth * 0.5, el.scrollWidth - el.clientWidth));
      });
    }, [selectedEventId, filtered, minY]);

    useImperativeHandle(ref, () => ({ scrollToToday, scrollToYear }), [scrollToToday, scrollToYear]);

    const activateEvent = useCallback(
      (id: string) => {
        selectEvent(id);
        onEventOpen?.(id);
      },
      [selectEvent, onEventOpen],
    );

    return (
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border border-neutral-300 shadow-sm",
          fillHeight && "min-h-0 flex-1",
        )}
        style={{ background: CANVAS_BG }}
      >
        <div
          ref={scrollRef}
          className={cn(
            "timeline-scroll cursor-grab touch-none overflow-x-auto overflow-y-auto select-none active:cursor-grabbing",
            fillHeight ? "flex min-h-0 flex-1" : "min-h-[320px] flex-1",
          )}
        >
          <div className="inline-flex min-h-full min-w-min items-start">
            <div className="relative shrink-0 font-sans" style={{ width: totalWidth, height: totalHeight }}>
            {ERA_BANDS.map((era) => {
              const x0 = yearToX(era.startYear, minY, pxPerYear);
              const x1 = yearToX(era.endYear, minY, pxPerYear);
              return (
                <div
                  key={era.id}
                  className="absolute border-r border-neutral-300/40"
                  style={{
                    left: x0,
                    width: Math.max(x1 - x0, 2),
                    top: HEADER_H,
                    height: tickBandTop - HEADER_H,
                    background: era.tint,
                  }}
                />
              );
            })}

            <div
              className="pointer-events-none absolute left-0 right-0 z-[5]"
              style={{
                top: railY - 1,
                height: 2,
                background: AXIS_BLUE,
                boxShadow: "0 1px 0 rgba(255,255,255,0.35)",
              }}
            />

            {filtered.map((ev) => {
              const sy = eventStartYear(ev);
              const ey = Math.max(eventEndYear(ev), sy + 0.25);
              const x0 = yearToX(sy, minY, pxPerYear);
              const x1 = yearToX(ey, minY, pxPerYear);
              const w = Math.max(x1 - x0, 2);
              const wm = writtenMidYear(ev);
              const dotX = wm != null ? yearToX(wm, minY, pxPerYear) : null;
              const spanMid = (x0 + x1) / 2;
              const showWritten =
                ev.type === "bible_book" && dotX != null && Math.abs(dotX - spanMid) > pxPerYear * 8;
              const spanYears = ey - sy;
              const isLife = (ev.type === "person" || ev.type === "ruler") && spanYears >= 0.51;
              const isWideRange = spanYears >= 1;
              const showBrackets = isLife || (isWideRange && spanYears >= 2);
              const spanRow = spanLayout.byId.get(ev.id) ?? 0;
              const top = railY + SPAN_ROW_TOP + spanRow * SPAN_ROW_STEP;
              const barH = isLife ? 5 : isWideRange ? 3 : 2;
              const hex6 = ev.color && /^#[0-9a-fA-F]{6}$/.test(ev.color) ? ev.color : null;
              const barBg = hex6
                ? isLife
                  ? `${hex6}99`
                  : isWideRange
                    ? `${hex6}55`
                    : "rgba(30,64,112,0.18)"
                : isLife
                  ? "rgba(42,80,136,0.62)"
                  : isWideRange
                    ? "rgba(30,64,112,0.35)"
                    : "rgba(30,64,112,0.18)";
              const cap = hex6 ?? AXIS_BLUE;
              return (
                <div key={`span-${ev.id}`}>
                  <div
                    className="absolute z-[4]"
                    style={{
                      left: x0,
                      width: w,
                      top,
                      height: barH,
                      borderRadius: isWideRange || isLife ? 2 : 1,
                      backgroundColor: barBg,
                      boxShadow: isLife ? `inset 0 0 0 1px rgba(255,255,255,0.25)` : undefined,
                    }}
                    title={ev.title}
                  />
                  {showBrackets ? (
                    <>
                      <div
                        className="pointer-events-none absolute z-[5] rounded-[1px]"
                        style={{ left: x0 - 1, top: top - 1, width: 2, height: barH + 2, backgroundColor: cap }}
                      />
                      <div
                        className="pointer-events-none absolute z-[5] rounded-[1px]"
                        style={{ left: x0 + w - 1, top: top - 1, width: 2, height: barH + 2, backgroundColor: cap }}
                      />
                    </>
                  ) : null}
                  {showWritten ? (
                    <div
                      className="pointer-events-none absolute z-[7] h-2 w-2 rotate-45 border border-amber-900/40 bg-amber-400"
                      style={{ left: dotX! - 4, top: railY - 4 }}
                      title="Written (approx.)"
                    />
                  ) : null}
                </div>
              );
            })}

            {ERA_BANDS.map((era) => {
              const mid = (era.startYear + era.endYear) / 2;
              const x = yearToX(mid, minY, pxPerYear);
              return (
                <TimelineEraBubble
                  key={`era-bubble-${era.id}`}
                  label={era.label}
                  left={x}
                  top={railY - 58}
                  onActivate={() => scrollToYear(mid)}
                />
              );
            })}

            {placements.map((p) => (
              <Fragment key={p.event.id}>
                <TimelineEventBubble
                  event={p.event}
                  avatarUrl={getAvatarUrl?.(p.event.id) ?? null}
                  anchorX={p.anchorX}
                  railY={railY}
                  centerY={bubbleCenterY(p.side, p.lane)}
                  side={p.side}
                  selected={selectedEventId === p.event.id}
                  onActivate={() => activateEvent(p.event.id)}
                />
              </Fragment>
            ))}

            {showToday ? (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-[4] w-px -translate-x-1/2 border-l border-dashed border-amber-700/90"
                style={{ left: todayX }}
              >
                <span
                  className="absolute whitespace-nowrap rounded border border-amber-800/30 bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-900"
                  style={{ left: 4, top: railY - 22 }}
                >
                  Today
                </span>
              </div>
            ) : null}

            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-neutral-400/60"
              style={{ top: tickBandTop, height: 1 }}
            />
            {ticks.map((t) => (
              <Fragment key={`tick-${t.year}-${t.kind}`}>
                <div
                  className="absolute w-px -translate-x-1/2 bg-neutral-500/70"
                  style={{
                    left: t.x,
                    top: t.kind === "major" ? tickBandTop - 14 : tickBandTop - 8,
                    height: t.kind === "major" ? 14 : 8,
                  }}
                />
                {t.kind === "major" ? (
                  <span
                    className="absolute -translate-x-1/2 text-[9px] font-medium tabular-nums text-neutral-700"
                    style={{ left: t.x, top: tickBandTop + 2 }}
                  >
                    {formatTickYear(t.year)}
                  </span>
                ) : null}
              </Fragment>
            ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
