import type { Note } from "@/types";

import { TagBadge } from "./TagBadge";

export function NoteCard({ note, onClick }: { note: Note; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-black/[0.06] bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:border-primary/20 hover:shadow-float"
    >
      <p className="text-sm font-semibold tracking-tight text-foreground">{note.title || "Untitled"}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.body?.replace(/[#*`]/g, "") || "—"}</p>
      {note.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.map((t) => (
            <TagBadge key={t.id} name={t.name} color={t.color} />
          ))}
        </div>
      ) : null}
    </button>
  );
}
