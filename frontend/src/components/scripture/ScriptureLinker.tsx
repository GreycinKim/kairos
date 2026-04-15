import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ScriptureLinker({
  onLink,
  onCancel,
}: {
  onLink: (payload: {
    source_type: string;
    source_id: string;
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const [sourceType, setSourceType] = useState("note");
  const [sourceId, setSourceId] = useState("");
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState("3");
  const [vs, setVs] = useState("16");
  const [ve, setVe] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sourceId.trim()) return;
        onLink({
          source_type: sourceType,
          source_id: sourceId.trim(),
          book: book.trim(),
          chapter: parseInt(chapter, 10),
          verse_start: parseInt(vs, 10),
          verse_end: ve ? parseInt(ve, 10) : null,
        });
      }}
    >
      <div>
        <label className="text-[11px] font-medium text-muted-foreground">Source type</label>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="apple-field mt-1.5">
          <option value="note">Note</option>
          <option value="journal">Journal entry</option>
          <option value="prayer">Prayer</option>
          <option value="word_study">Word study</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground">Source UUID</label>
        <input
          required
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          placeholder="Paste id from URL or notes list"
          className="apple-field mt-1.5 font-mono text-xs"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <input value={book} onChange={(e) => setBook(e.target.value)} placeholder="Book" className="apple-field text-sm" />
        <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Ch" className="apple-field text-sm" />
        <input value={vs} onChange={(e) => setVs(e.target.value)} placeholder="Vs" className="apple-field text-sm" />
        <input value={ve} onChange={(e) => setVe(e.target.value)} placeholder="End" className="apple-field text-sm" />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save link</Button>
      </div>
    </form>
  );
}
