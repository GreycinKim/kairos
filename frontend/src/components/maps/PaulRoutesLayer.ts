import { ArcLayer, TextLayer } from "@deck.gl/layers";

import type { PaulArcDatum } from "@/lib/biblicalRoutesCatalog";

/** Initial bearing from `from` to `to` in degrees, 0 = north, 90 = east (clockwise). */
function bearingDegClockwiseFromNorth(from: [number, number], to: [number, number]): number {
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

/** Nudge toward `from` from `to` so glyphs sit slightly short of the destination. */
function nudgeBack(from: [number, number], to: [number, number], frac: number): [number, number] {
  return [to[0] - (to[0] - from[0]) * frac, to[1] - (to[1] - from[1]) * frac];
}

/**
 * Rotation for a “▸” glyph (points east at 0°) so it aims along the segment toward the target.
 * Tuned for deck.gl TextLayer `getAngle` with billboard labels (map north-up).
 */
function segmentArrowTextAngle(from: [number, number], to: [number, number]): number {
  const brg = bearingDegClockwiseFromNorth(from, to);
  return 90 - brg;
}

/** deck.gl ArcLayers for Paul segment routes (sea vs land styling). `pickable: false` so map markers stay clickable. */
export function createPaulArcLayers(arcs: PaulArcDatum[]) {
  const sea = arcs.filter((a) => a.mode === "sea");
  const land = arcs.filter((a) => a.mode === "land");
  const layers: (ArcLayer<PaulArcDatum> | TextLayer<PaulArcDatum>)[] = [];
  if (sea.length) {
    layers.push(
      new ArcLayer<PaulArcDatum>({
        id: "kairos-paul-sea-arcs",
        data: sea,
        pickable: false,
        greatCircle: true,
        getSourcePosition: (d) => d.sourcePosition,
        getTargetPosition: (d) => d.targetPosition,
        getSourceColor: [59, 130, 246, 200],
        getTargetColor: [37, 99, 235, 200],
        getHeight: 0.4,
        getWidth: 3,
      }),
    );
  }
  if (land.length) {
    layers.push(
      new ArcLayer<PaulArcDatum>({
        id: "kairos-paul-land-arcs",
        data: land,
        pickable: false,
        greatCircle: true,
        getSourcePosition: (d) => d.sourcePosition,
        getTargetPosition: (d) => d.targetPosition,
        getSourceColor: [234, 88, 12, 200],
        getTargetColor: [194, 65, 12, 200],
        getHeight: 0.1,
        getWidth: 2,
      }),
    );
  }

  if (arcs.length) {
    layers.push(
      new TextLayer<PaulArcDatum>({
        id: "kairos-paul-segment-arrows",
        data: arcs,
        pickable: false,
        billboard: true,
        characterSet: "▸",
        fontFamily: "system-ui, sans-serif",
        getText: () => "▸",
        getPosition: (d) => nudgeBack(d.sourcePosition, d.targetPosition, 0.045),
        getSize: 15,
        getColor: (d) =>
          d.mode === "sea" ? [30, 64, 175, 255] : [154, 52, 18, 255],
        getAngle: (d) => segmentArrowTextAngle(d.sourcePosition, d.targetPosition),
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        fontSettings: { sdf: true },
        outlineWidth: 0.12,
        outlineColor: [255, 255, 255, 240],
      }),
    );
  }

  return layers;
}
