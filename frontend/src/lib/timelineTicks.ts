import { yearToX } from "./timelineMath";

export function pickTickSteps(pxPerYear: number, targetPx = 72): { major: number; minor: number } {
  const idealYears = targetPx / Math.max(pxPerYear, 0.001);
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  let major = candidates[candidates.length - 1]!;
  for (const c of candidates) {
    if (c >= idealYears) {
      major = c;
      break;
    }
  }
  let minor = major / 5;
  if (minor < 1 && major >= 5) minor = major / 5;
  if (minor < 1) minor = 1;
  if (minor >= major) minor = Math.max(1, major / 2);
  return { major, minor };
}

export type TickItem = { year: number; x: number; kind: "major" | "minor" };

function isMajorYear(y: number, major: number): boolean {
  const q = y / major;
  return Math.abs(q - Math.round(q)) < 1e-6;
}

export function buildTicks(
  minY: number,
  maxY: number,
  pxPerYear: number,
  minPixelMinorGap = 4,
): TickItem[] {
  const { major, minor } = pickTickSteps(pxPerYear);
  const out: TickItem[] = [];
  const start = Math.floor(minY / minor) * minor;
  let lastMinorX = -Infinity;
  for (let y = start; y <= maxY + minor * 0.5; y += minor) {
    const yr = Math.round(y * 100) / 100;
    const x = yearToX(yr, minY, pxPerYear);
    if (out.length > 0 && x - lastMinorX < minPixelMinorGap) continue;
    out.push({ year: yr, x, kind: isMajorYear(yr, major) ? "major" : "minor" });
    lastMinorX = x;
  }
  return out;
}
