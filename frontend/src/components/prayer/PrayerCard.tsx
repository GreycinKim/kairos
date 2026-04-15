import { GripVertical, Trash2 } from "lucide-react";
import clsx from "clsx";

import { Button } from "@/components/ui/button";
import type { Prayer } from "@/types";

const PRAYER_DRAG_MIME = "application/x-kairos-prayer";

export function PrayerCard({
  prayer,
  onEdit,
  onRequestDelete,
  useCoarseDrag,
  isTouchDragging,
  onTouchDragStart,
}: {
  prayer: Prayer;
  onEdit?: (p: Prayer) => void;
  onRequestDelete?: (p: Prayer) => void;
  /** When true (e.g. iPad), use pointer drag instead of HTML5 drag — mobile Safari does not support drag-and-drop reliably. */
  useCoarseDrag?: boolean;
  isTouchDragging?: boolean;
  onTouchDragStart?: (prayerId: string, pointerId: number) => void;
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(PRAYER_DRAG_MIME, JSON.stringify({ id: prayer.id }));
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: prayer.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={clsx(
        "flex items-stretch gap-1 rounded-xl border border-black/[0.06] bg-card shadow-sm transition-all duration-200 ease-out hover:border-primary/20 hover:shadow-float",
        isTouchDragging && "opacity-60 ring-2 ring-primary/30",
      )}
    >
      <div
        className={clsx(
          "flex w-8 shrink-0 cursor-grab items-center justify-center border-r border-black/[0.06] text-muted-foreground active:cursor-grabbing",
          useCoarseDrag && "touch-none",
        )}
        draggable={!useCoarseDrag}
        onDragStart={useCoarseDrag ? undefined : onDragStart}
        onPointerDown={(e) => {
          if (!useCoarseDrag || !onTouchDragStart) return;
          if (e.pointerType === "mouse") return;
          e.preventDefault();
          onTouchDragStart(prayer.id, e.pointerId);
        }}
        title="Drag to another column"
      >
        <GripVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      {onRequestDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto shrink-0 rounded-none border-r border-black/[0.06] px-2 text-muted-foreground hover:text-destructive"
          title="Delete prayer"
          aria-label="Delete prayer"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(prayer);
          }}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </Button>
      ) : null}
      <button
        type="button"
        onClick={() => onEdit?.(prayer)}
        className="min-w-0 flex-1 px-3 py-4 text-left"
      >
        <p className="text-sm font-semibold tracking-tight text-foreground">{prayer.title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Prayed {prayer.prayed_on}</p>
        {prayer.body ? <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{prayer.body}</p> : null}
        {prayer.status === "answered" && prayer.answered_on ? (
          <p className="mt-2 text-[11px] font-medium text-primary">Answered {prayer.answered_on}</p>
        ) : null}
        {prayer.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {prayer.tags.map((t) => (
              <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </button>
    </div>
  );
}

export function parsePrayerDrag(e: React.DragEvent): string | null {
  try {
    const raw = e.dataTransfer.getData(PRAYER_DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const j = JSON.parse(raw) as { id?: string };
    return typeof j.id === "string" ? j.id : null;
  } catch {
    return null;
  }
}
