import { useEffect, useState } from "react";

import { api } from "@/api/client";

interface LinkRow {
  id: string;
  source_note_id: string;
  target_note_id: string;
  link_type: string | null;
}

/** Minimal graph summary for a note (MVP: list of connections). */
export function NoteLinkGraph({ noteId }: { noteId: string }) {
  const [links, setLinks] = useState<LinkRow[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<LinkRow[]>("/note-links");
        setLinks(data.filter((l) => l.source_note_id === noteId || l.target_note_id === noteId));
      } catch {
        setLinks([]);
      }
    })();
  }, [noteId]);

  if (!links.length) return null;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-muted/25 p-3 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Note links</p>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {links.map((l) => (
          <li key={l.id}>
            {l.link_type ?? "related"} →{" "}
            <span className="font-medium text-foreground">
              {l.source_note_id === noteId ? l.target_note_id.slice(0, 8) : l.source_note_id.slice(0, 8)}…
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
