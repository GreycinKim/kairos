import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Note, Tag, Theme } from "@/types";
import { useNotesStore } from "@/store/notesStore";

interface NoteEditorProps {
  note: Note;
  allTags: Tag[];
  allThemes: Theme[];
}

export function NoteEditor({ note, allTags, allThemes }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title ?? "");
  const [body, setBody] = useState(note.body ?? "");
  const updateNote = useNotesStore((s) => s.updateNote);

  useEffect(() => {
    setTitle(note.title ?? "");
    setBody(note.body ?? "");
  }, [note.id, note.title, note.body]);

  const save = useCallback(
    async (patch: { title?: string; body?: string; tag_ids?: string[]; theme_ids?: string[] }) => {
      await updateNote(note.id, patch);
    },
    [note.id, updateNote],
  );

  useEffect(() => {
    const h = window.setTimeout(() => {
      if (title === (note.title ?? "") && body === (note.body ?? "")) return;
      void save({ title, body });
    }, 850);
    return () => window.clearTimeout(h);
  }, [title, body, note.title, note.body, save]);

  const selectedTagIds = new Set((note.tags ?? []).map((t) => t.id));
  const selectedThemeIds = new Set((note.themes ?? []).map((t) => t.id));

  const toggleTag = async (tagId: string) => {
    const next = new Set(selectedTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    await save({ tag_ids: [...next] });
  };

  const toggleTheme = async (themeId: string) => {
    const next = new Set(selectedThemeIds);
    if (next.has(themeId)) next.delete(themeId);
    else next.add(themeId);
    await save({ theme_ids: [...next] });
  };

  return (
    <div className="flex flex-col gap-4">
      <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
      <div data-color-mode="light" className="overflow-hidden rounded-xl border border-input bg-white shadow-sm">
        <MDEditor value={body} onChange={(v) => setBody(v ?? "")} height={280} preview="edit" visibleDragbar={false} />
      </div>
      <p className="text-[11px] text-muted-foreground">Auto-saves after you pause typing. Use [[Note Title]] to link notes.</p>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors duration-200 ease-out hover:border-primary/25 hover:bg-white"
            >
              <input
                type="checkbox"
                className="size-3.5 rounded border-input accent-primary"
                checked={selectedTagIds.has(t.id)}
                onChange={() => void toggleTag(t.id)}
              />
              {t.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Themes</p>
        <div className="flex flex-wrap gap-2">
          {allThemes.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors duration-200 ease-out hover:border-primary/25 hover:bg-white"
            >
              <input
                type="checkbox"
                className="size-3.5 rounded border-input accent-primary"
                checked={selectedThemeIds.has(t.id)}
                onChange={() => void toggleTheme(t.id)}
              />
              <span style={{ color: t.color ?? undefined }}>{t.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
