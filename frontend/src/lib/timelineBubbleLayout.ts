import type { TimelineEvent } from "@/types";

import { eventStartYear, yearToX } from "./timelineMath";

/** Single anchor on the timeline for labeling (composition when known for books). */
export function eventAnchorYear(ev: TimelineEvent): number {
  return eventStartYear(ev);
}

export type BubblePlacement = {
  event: TimelineEvent;
  anchorX: number;
  anchorYear: number;
  side: "above" | "below";
  lane: number;
};

/** Greedy lane packing so nearby events stack above/below the rail instead of overlapping. */
export function packEventBubbles(
  events: TimelineEvent[],
  minY: number,
  pxPerYear: number,
  minGapPx: number,
): BubblePlacement[] {
  const sorted = [...events]
    .map((ev) => {
      const anchorYear = eventAnchorYear(ev);
      return {
        event: ev,
        anchorYear,
        anchorX: yearToX(anchorYear, minY, pxPerYear),
      };
    })
    .sort((a, b) => a.anchorX - b.anchorX);

  const lastAbove = new Map<number, number>();
  const lastBelow = new Map<number, number>();
  const out: BubblePlacement[] = [];

  for (const row of sorted) {
    let placed = false;
    for (let lane = 0; lane < 12; lane++) {
      const last = lastAbove.get(lane);
      if (last === undefined || row.anchorX - last >= minGapPx) {
        out.push({
          event: row.event,
          anchorX: row.anchorX,
          anchorYear: row.anchorYear,
          side: "above",
          lane,
        });
        lastAbove.set(lane, row.anchorX);
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let lane = 0; lane < 12; lane++) {
        const last = lastBelow.get(lane);
        if (last === undefined || row.anchorX - last >= minGapPx) {
          out.push({
            event: row.event,
            anchorX: row.anchorX,
            anchorYear: row.anchorYear,
            side: "below",
            lane,
          });
          lastBelow.set(lane, row.anchorX);
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      out.push({
        event: row.event,
        anchorX: row.anchorX,
        anchorYear: row.anchorYear,
        side: "above",
        lane: 0,
      });
    }
  }
  return out;
}

export function maxLaneDepth(placements: BubblePlacement[], side: "above" | "below"): number {
  let m = 0;
  for (const p of placements) {
    if (p.side === side) m = Math.max(m, p.lane + 1);
  }
  return m;
}
