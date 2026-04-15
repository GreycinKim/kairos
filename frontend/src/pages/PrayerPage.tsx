import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Modal } from "@/components/shared/Modal";
import { parsePrayerDrag, PrayerCard } from "@/components/prayer/PrayerCard";
import { PrayerForm } from "@/components/prayer/PrayerForm";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import type { Prayer, TimelineEvent } from "@/types";
import clsx from "clsx";

const STATUSES = ["waiting", "ongoing", "answered"] as const;
type PrayerStatus = (typeof STATUSES)[number];

function labelForStatus(s: PrayerStatus): string {
  if (s === "waiting") return "Waiting";
  if (s === "ongoing") return "Ongoing";
  return "Answered";
}

export function PrayerPage() {
  const [searchParams] = useSearchParams();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, ongoing: 0, answered: 0 });
  const [tagFilter, setTagFilter] = useState("");
  const [modal, setModal] = useState<Prayer | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prayer | null>(null);
  const [dragOver, setDragOver] = useState<PrayerStatus | null>(null);
  const [coarsePointer, setCoarsePointer] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(any-pointer: coarse)").matches,
  );
  const [touchDrag, setTouchDrag] = useState<{ id: string; pointerId: number } | null>(null);
  const columnRefs = useRef<Record<PrayerStatus, HTMLElement | null>>({
    waiting: null,
    ongoing: null,
    answered: null,
  });

  useEffect(() => {
    const mq = window.matchMedia("(any-pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const load = useCallback(async () => {
    const [pRes, sRes, eRes] = await Promise.all([
      api.get<Prayer[]>("/prayers"),
      api.get<{ total: number; waiting: number; ongoing: number; answered: number }>("/prayers/stats"),
      api.get<TimelineEvent[]>("/timeline/events"),
    ]);
    setPrayers(pRes.data);
    setStats(sRes.data);
    setEvents(eRes.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const pid = searchParams.get("prayer");
    if (!pid || !prayers.length) return;
    const p = prayers.find((x) => x.id === pid);
    if (p) setModal(p);
  }, [searchParams, prayers]);

  const filtered = useMemo(() => {
    if (!tagFilter.trim()) return prayers;
    return prayers.filter((p) => p.tags?.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())));
  }, [prayers, tagFilter]);

  const byStatus = useCallback(
    (s: PrayerStatus) => filtered.filter((p) => p.status === s),
    [filtered],
  );

  const movePrayerToStatus = useCallback(
    async (prayerId: string, status: PrayerStatus) => {
      const prev = prayers.find((p) => p.id === prayerId);
      if (!prev || prev.status === status) return;
      setPrayers((list) => list.map((p) => (p.id === prayerId ? { ...p, status } : p)));
      try {
        await api.patch(`/prayers/${prayerId}`, { status });
        await load();
      } catch {
        await load();
      }
    },
    [prayers, load],
  );

  useEffect(() => {
    if (!touchDrag) return;
    const { id, pointerId } = touchDrag;

    const hitColumn = (clientX: number, clientY: number): PrayerStatus | null => {
      for (const st of STATUSES) {
        const node = columnRefs.current[st];
        if (!node) continue;
        const r = node.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return st;
      }
      return null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      e.preventDefault();
      setDragOver(hitColumn(e.clientX, e.clientY));
    };

    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const st = hitColumn(e.clientX, e.clientY);
      if (st) void movePrayerToStatus(id, st);
      setDragOver(null);
      setTouchDrag(null);
    };

    document.addEventListener("pointermove", onMove, { capture: true, passive: false });
    document.addEventListener("pointerup", onEnd, { capture: true });
    document.addEventListener("pointercancel", onEnd, { capture: true });
    return () => {
      document.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointerup", onEnd, { capture: true });
      document.removeEventListener("pointercancel", onEnd, { capture: true });
    };
  }, [touchDrag, movePrayerToStatus]);

  const dropHandlers = (status: PrayerStatus) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOver(status);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const id = parsePrayerDrag(e);
      if (!id) return;
      void movePrayerToStatus(id, status);
    },
  });

  return (
    <div className="px-6 py-8 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Prayers</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Drag a prayer by the grip to move it between Waiting, Ongoing, and Answered
          {coarsePointer ? " (touch and hold the grip, then drag)" : ""}. Click the card to edit, or use the trash icon to
          delete.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total", stats.total],
            ["Waiting", stats.waiting],
            ["Ongoing", stats.ongoing],
            ["Answered", stats.answered],
          ].map(([l, n]) => (
            <div
              key={String(l)}
              className="rounded-2xl border border-black/[0.06] bg-card px-4 py-4 text-center shadow-sm"
            >
              <p className="text-2xl font-semibold tabular-nums text-primary">{n}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={tagFilter} onChange={setTagFilter} placeholder="Filter by tag…" className="sm:max-w-xs" />
          <Button type="button" onClick={() => setModal("new")} className="shrink-0">
            New prayer
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {STATUSES.map((status) => (
          <section
            key={status}
            ref={(node) => {
              columnRefs.current[status] = node;
            }}
            className={clsx(
              "min-h-[12rem] rounded-2xl border border-dashed border-black/[0.12] bg-card p-5 shadow-sm transition-colors",
              dragOver === status && "border-primary/50 bg-primary/5",
            )}
            {...dropHandlers(status)}
          >
            <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">{labelForStatus(status)}</h2>
            <PrayerColumnList
              prayers={byStatus(status)}
              onEdit={(p) => setModal(p)}
              onRequestDelete={(p) => setDeleteTarget(p)}
              useCoarseDrag={coarsePointer}
              touchDragId={touchDrag?.id ?? null}
              onTouchDragStart={(prayerId, pid) => setTouchDrag({ id: prayerId, pointerId: pid })}
            />
          </section>
        ))}
      </div>

      <Modal open={modal != null} onClose={() => setModal(null)} title={modal && modal !== "new" ? "Edit prayer" : "New prayer"} wide>
        <PrayerForm
          initial={modal && modal !== "new" ? modal : null}
          events={events}
          onCancel={() => setModal(null)}
          onDelete={
            modal && modal !== "new"
              ? async () => {
                  await api.delete(`/prayers/${modal.id}`);
                  setModal(null);
                  void load();
                }
              : undefined
          }
          onSave={async (payload) => {
            if (modal && modal !== "new") {
              await api.patch(`/prayers/${modal.id}`, payload);
            } else {
              await api.post("/prayers", payload);
            }
            setModal(null);
            void load();
          }}
        />
      </Modal>

      <Modal open={deleteTarget != null} onClose={() => setDeleteTarget(null)} title="Delete prayer?">
        {deleteTarget ? (
          <>
            <p className="text-sm text-muted-foreground">
              Remove <span className="font-medium text-foreground">{deleteTarget.title}</span> permanently? This cannot
              be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (!deleteTarget) return;
                  void (async () => {
                    try {
                      await api.delete(`/prayers/${deleteTarget.id}`);
                      setDeleteTarget(null);
                      void load();
                    } catch {
                      setDeleteTarget(null);
                    }
                  })();
                }}
              >
                Delete
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}

function PrayerColumnList({
  prayers,
  onEdit,
  onRequestDelete,
  useCoarseDrag,
  touchDragId,
  onTouchDragStart,
}: {
  prayers: Prayer[];
  onEdit: (p: Prayer) => void;
  onRequestDelete: (p: Prayer) => void;
  useCoarseDrag: boolean;
  touchDragId: string | null;
  onTouchDragStart: (prayerId: string, pointerId: number) => void;
}) {
  if (!prayers.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No prayers in this column.</p>;
  }
  return (
    <div className="space-y-3">
      {prayers.map((p) => (
        <PrayerCard
          key={p.id}
          prayer={p}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          useCoarseDrag={useCoarseDrag}
          isTouchDragging={touchDragId === p.id}
          onTouchDragStart={onTouchDragStart}
        />
      ))}
    </div>
  );
}
