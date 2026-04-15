import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteLinkGraph } from "@/components/notes/NoteLinkGraph";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import type { Theme, TimelineEvent } from "@/types";
import { useNotesStore } from "@/store/notesStore";

function formatWhen(ev: TimelineEvent): string {
  if (ev.start_date) {
    const r = ev.end_date && ev.end_date !== ev.start_date ? ` – ${ev.end_date}` : "";
    return `${ev.start_date}${r}`;
  }
  if (ev.start_year != null) {
    const a = ev.start_year <= 0 ? `${Math.abs(ev.start_year)} BC` : `${ev.start_year} AD`;
    if (ev.end_year != null) {
      const b = ev.end_year <= 0 ? `${Math.abs(ev.end_year)} BC` : `${ev.end_year} AD`;
      return `${a} — ${b}`;
    }
    return a;
  }
  return "—";
}

function formatWritten(ev: TimelineEvent): string | null {
  if (ev.written_start_year == null) return null;
  const a = ev.written_start_year <= 0 ? `${Math.abs(ev.written_start_year)} BC` : `${ev.written_start_year} AD`;
  if (ev.written_end_year == null || ev.written_end_year === ev.written_start_year) {
    return `Written · ${a}`;
  }
  const b = ev.written_end_year <= 0 ? `${Math.abs(ev.written_end_year)} BC` : `${ev.written_end_year} AD`;
  return `Written · ${a} — ${b}`;
}

export function EventNotesWorkspace({
  event,
  deepDivePath,
  onDeleteEvent,
  eventImageUrl,
  onEventImageChange,
  headerEnd,
}: {
  event: TimelineEvent;
  deepDivePath?: string | null;
  onDeleteEvent?: (eventId: string) => Promise<void> | void;
  eventImageUrl?: string | null;
  onEventImageChange?: (dataUrl: string | null) => void;
  headerEnd?: ReactNode;
}) {
  const fetchNotesForEvent = useNotesStore((s) => s.fetchNotesForEvent);
  const createNote = useNotesStore((s) => s.createNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const tags = useNotesStore((s) => s.tags);
  const fetchTags = useNotesStore((s) => s.fetchTags);
  const notesByEvent = useNotesStore((s) => s.notesByEvent);
  const loadingNotes = useNotesStore((s) => s.loadingNotes);
  const notes = notesByEvent[event.id] ?? [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<Theme[]>("/themes");
        setThemes(data);
      } catch {
        setThemes([]);
      }
    })();
  }, []);

  useEffect(() => {
    void fetchNotesForEvent(event.id);
  }, [event.id, fetchNotesForEvent]);

  useEffect(() => {
    if (!notes.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !notes.some((n) => n.id === activeId)) {
      setActiveId(notes[0]!.id);
    }
  }, [notes, activeId]);

  const activeNote = notes.find((n) => n.id === activeId) ?? notes[0];

  const newNote = async () => {
    const n = await createNote(event.id, "New note");
    if (n) setActiveId(n.id);
  };

  const removeNote = async (noteId: string) => {
    if (!window.confirm("Delete this note permanently?")) return;
    const ok = await deleteNote(noteId, event.id);
    if (!ok) return;
    const rest = notes.filter((n) => n.id !== noteId);
    setActiveId(rest[0]?.id ?? null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{event.type.replace("_", " ")}</p>
          <h2 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {event.icon ? <span className="mr-1.5">{event.icon}</span> : null}
            {event.title}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">{formatWhen(event)}</p>
          {formatWritten(event) ? <p className="mt-1 text-[12px] text-primary">{formatWritten(event)}</p> : null}
          {event.era ? <p className="mt-1 text-[12px] text-muted-foreground">Era · {event.era}</p> : null}
          {event.author ? <p className="mt-1 text-[12px] text-muted-foreground">Author · {event.author}</p> : null}
          {onEventImageChange ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {eventImageUrl ? (
                <img
                  src={eventImageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <span className="text-[11px] text-muted-foreground">No portrait yet.</span>
              )}
              <label className="cursor-pointer rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    const fr = new FileReader();
                    fr.onload = () => onEventImageChange(typeof fr.result === "string" ? fr.result : null);
                    fr.readAsDataURL(file);
                  }}
                />
              </label>
              {eventImageUrl ? (
                <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onEventImageChange(null)}>
                  Remove portrait
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {headerEnd ? <div className="flex shrink-0 items-start gap-2">{headerEnd}</div> : null}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-b border-border px-4 py-3 sm:px-6">
        <Button type="button" size="sm" className="shrink-0" onClick={() => void newNote()}>
          + Note
        </Button>
        {onDeleteEvent ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 text-red-700 hover:text-red-800"
            onClick={() => {
              if (window.confirm(`Delete "${event.title}" from timeline?`)) {
                void onDeleteEvent(event.id);
              }
            }}
          >
            Delete event
          </Button>
        ) : null}
        {deepDivePath ? (
          <Button type="button" size="sm" variant="outline" asChild className="shrink-0">
            <Link to={deepDivePath}>Open deep dive</Link>
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {notes.map((n) => (
            <div
              key={n.id}
              className="flex max-w-[200px] items-center gap-0.5 rounded-lg border border-border/60 bg-muted/20 pr-0.5"
            >
              <button
                type="button"
                onClick={() => setActiveId(n.id)}
                className={`min-w-0 flex-1 truncate rounded-l-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-200 ease-out ${
                  activeNote?.id === n.id ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {n.title || "Untitled"}
              </button>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete note ${n.title || "Untitled"}`}
                onClick={() => void removeNote(n.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {loadingNotes && !notes.length ? (
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        ) : activeNote ? (
          <>
            <NoteLinkGraph noteId={activeNote.id} />
            <div className="mt-5">
              <NoteEditor note={activeNote} allTags={tags} allThemes={themes} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet. Create one to begin.</p>
        )}
      </div>
    </div>
  );
}
