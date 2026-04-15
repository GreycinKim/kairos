import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { AtlasMapMarkerView } from "@/lib/mapAtlasOverlays";
import clsx from "clsx";

type Transform = { x: number; y: number; k: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const K_MIN = 0.35;
const K_MAX = 10;

type Action =
  | { type: "wheel"; cx: number; cy: number; deltaY: number; vw: number; vh: number }
  | { type: "zoomAtPoint"; cx: number; cy: number; vw: number; vh: number; k: number }
  | { type: "pan"; dx: number; dy: number }
  | { type: "reset" }
  | { type: "zoom"; factor: number };

function reduceTransform(s: Transform, a: Action): Transform {
  switch (a.type) {
    case "reset":
      return { x: 0, y: 0, k: 1 };
    case "pan":
      return { ...s, x: s.x + a.dx, y: s.y + a.dy };
    case "zoom": {
      const nk = clamp(s.k * a.factor, K_MIN, K_MAX);
      return { ...s, k: nk };
    }
    case "zoomAtPoint": {
      const nk = clamp(a.k, K_MIN, K_MAX);
      const r = nk / s.k;
      const mx = a.cx - a.vw / 2;
      const my = a.cy - a.vh / 2;
      return { k: nk, x: mx - (mx - s.x) * r, y: my - (my - s.y) * r };
    }
    case "wheel": {
      const zoom = a.deltaY > 0 ? 0.9 : 1.1;
      const nk = clamp(s.k * zoom, K_MIN, K_MAX);
      const r = nk / s.k;
      const mx = a.cx - a.vw / 2;
      const my = a.cy - a.vh / 2;
      return { k: nk, x: mx - (mx - s.x) * r, y: my - (my - s.y) * r };
    }
    default:
      return s;
  }
}

export type PanZoomAtlasRoute = {
  points: { nx: number; ny: number }[];
  color?: string;
};

type PanZoomImageProps = {
  src: string;
  alt?: string;
  className?: string;
  showControls?: boolean;
  controlsClassName?: string;
  /** RPG-style tokens on the map (normalized 0–1 coords). */
  atlasMarkers?: AtlasMapMarkerView[];
  /** Polylines in the same coordinate space as markers. */
  atlasRoutes?: PanZoomAtlasRoute[];
  /** Stronger double-tap / double-click zoom (e.g. Life of Jesus plates). */
  doubleTapZoom?: boolean;
};

type Pt = { x: number; y: number };

function pinchMetrics(pos: Map<number, Pt>): { dist: number; midX: number; midY: number } | null {
  if (pos.size < 2) return null;
  const vals = [...pos.values()];
  const a = vals[0];
  const b = vals[1];
  if (!a || !b) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return null;
  return { dist, midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
}

export function PanZoomImage({
  src,
  alt = "",
  className,
  showControls = true,
  controlsClassName,
  atlasMarkers,
  atlasRoutes,
  doubleTapZoom = false,
}: PanZoomImageProps) {
  const vpRef = useRef<HTMLDivElement>(null);
  const [t, dispatch] = useReducer(reduceTransform, { x: 0, y: 0, k: 1 });
  const tRef = useRef(t);
  tRef.current = t;
  const dragRef = useRef<{ id: number; lx: number; ly: number } | null>(null);
  const pointersRef = useRef<Map<number, Pt>>(new Map());
  const pinchPrevDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  useEffect(() => {
    pointersRef.current.clear();
    pinchPrevDistRef.current = null;
    dragRef.current = null;
    dispatch({ type: "reset" });
  }, [src]);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      dispatch({
        type: "wheel",
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top,
        deltaY: e.deltaY,
        vw: rect.width,
        vh: rect.height,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [src]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const map = pointersRef.current;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (map.size >= 2) {
      dragRef.current = null;
      const m = pinchMetrics(map);
      pinchPrevDistRef.current = m?.dist ?? null;
    } else {
      pinchPrevDistRef.current = null;
      dragRef.current = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
    }
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const map = pointersRef.current;
    if (!map.has(e.pointerId)) return;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const el = vpRef.current;
    if (map.size >= 2 && el) {
      const m = pinchMetrics(map);
      const prevD = pinchPrevDistRef.current;
      if (m && prevD != null && prevD > 0) {
        const scale = m.dist / prevD;
        pinchPrevDistRef.current = m.dist;
        const rect = el.getBoundingClientRect();
        const s = tRef.current;
        const nk = clamp(s.k * scale, K_MIN, K_MAX);
        dispatch({
          type: "zoomAtPoint",
          cx: m.midX - rect.left,
          cy: m.midY - rect.top,
          vw: rect.width,
          vh: rect.height,
          k: nk,
        });
      }
      return;
    }

    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.lx;
    const dy = e.clientY - d.ly;
    d.lx = e.clientX;
    d.ly = e.clientY;
    dispatch({ type: "pan", dx, dy });
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId);
      if (dragRef.current?.id === e.pointerId) dragRef.current = null;
      pinchPrevDistRef.current = null;

      const remaining = pointersRef.current;
      if (remaining.size === 1) {
        const [id, pt] = [...remaining.entries()][0]!;
        dragRef.current = { id, lx: pt.x, ly: pt.y };
      }

      if (doubleTapZoom && pointersRef.current.size === 0) {
        const el = vpRef.current;
        if (el) {
          const now = performance.now();
          const prev = lastTapRef.current;
          lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
          if (prev && now - prev.t < 340 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 28) {
            const rect = el.getBoundingClientRect();
            const factor = 1.48;
            dispatch({
              type: "zoomAtPoint",
              cx: e.clientX - rect.left,
              cy: e.clientY - rect.top,
              vw: rect.width,
              vh: rect.height,
              k: tRef.current.k * factor,
            });
            lastTapRef.current = null;
          }
        }
      }

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* */
      }
    },
    [doubleTapZoom],
  );

  const onDoubleClickZoom = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!doubleTapZoom) return;
      e.preventDefault();
      const el = vpRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      dispatch({
        type: "zoomAtPoint",
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top,
        vw: rect.width,
        vh: rect.height,
        k: tRef.current.k * 1.55,
      });
    },
    [doubleTapZoom],
  );

  const hasOverlays = Boolean((atlasMarkers?.length ?? 0) > 0 || (atlasRoutes?.length ?? 0) > 0);

  return (
    <div className={clsx("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      {showControls ? (
        <div
          className={clsx(
            "flex shrink-0 flex-wrap items-center justify-end gap-1 border-b border-neutral-200/80 bg-white/90 px-1 py-1",
            controlsClassName,
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            aria-label="Zoom out"
            onClick={() => dispatch({ type: "zoom", factor: 1 / 1.2 })}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" aria-label="Reset view" onClick={() => dispatch({ type: "reset" })}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            aria-label="Zoom in"
            onClick={() => dispatch({ type: "zoom", factor: 1.2 })}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="px-2 text-[10px] tabular-nums text-neutral-500">{Math.round(t.k * 100)}%</span>
        </div>
      ) : null}

      <div
        ref={vpRef}
        role="application"
        aria-label="Pan and zoom map — drag to move, wheel or pinch to zoom"
        className="relative min-h-0 w-full flex-1 cursor-grab touch-none overflow-hidden bg-neutral-200/50 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClickZoom}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`,
            transformOrigin: "center center",
          }}
        >
          <div className="relative inline-block max-h-full max-w-full">
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="block max-h-full max-w-full select-none object-contain"
              decoding="async"
            />
            {hasOverlays ? (
              <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
                <svg
                  className="absolute left-0 top-0 h-full w-full"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  {(atlasRoutes ?? []).map((route, ri) =>
                    route.points.length >= 2 ? (
                      <polyline
                        key={`route-${ri}`}
                        fill="none"
                        stroke={route.color ?? "#ea580c"}
                        strokeWidth={0.006}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        points={route.points.map((p) => `${p.nx},${p.ny}`).join(" ")}
                      />
                    ) : null,
                  )}
                </svg>
                {(atlasMarkers ?? []).map((m, mi) => {
                  const inner = m.imageSrc ? (
                    <img src={m.imageSrc} alt="" className="h-full w-full rounded-full border-2 border-white object-cover shadow-md" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-amber-50 text-lg shadow-md">
                      {m.fallbackEmoji ?? "·"}
                    </span>
                  );
                  const style = { left: `${m.nx * 100}%`, top: `${m.ny * 100}%` } as const;
                  return m.href ? (
                    <Link
                      key={`m-${mi}`}
                      to={m.href}
                      title={m.label}
                      className="pointer-events-auto absolute z-[2] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                      style={style}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={`m-${mi}`}
                      title={m.label}
                      className="absolute z-[2] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={style}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
