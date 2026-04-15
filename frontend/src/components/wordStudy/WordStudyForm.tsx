import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { WordStudy } from "@/types";
import { api } from "@/api/client";

interface WordStudyFormProps {
  initial?: WordStudy | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function WordStudyForm({ initial, onSaved, onCancel }: WordStudyFormProps) {
  const [word, setWord] = useState(initial?.word ?? "");
  const [transliteration, setTransliteration] = useState(initial?.transliteration ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "greek");
  const [strongs, setStrongs] = useState(initial?.strongs_number ?? "");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [notes, setNotes] = useState(initial?.extended_notes ?? "");
  const [verses, setVerses] = useState((initial?.verse_references ?? []).join(", "));
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const verseList = verses
        .split(/[,;\n]/)
        .map((v) => v.trim())
        .filter(Boolean);
      const payload = {
        word,
        transliteration: transliteration || null,
        language: language || null,
        strongs_number: strongs || null,
        definition: definition || null,
        extended_notes: notes || null,
        verse_references: verseList.length ? verseList : null,
      };
      if (initial) {
        await api.patch(`/word-studies/${initial.id}`, payload);
      } else {
        await api.post("/word-studies", payload);
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Word</label>
          <input required value={word} onChange={(e) => setWord(e.target.value)} className="apple-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Transliteration</label>
          <input value={transliteration} onChange={(e) => setTransliteration(e.target.value)} className="apple-field" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="apple-field">
            <option value="greek">Greek</option>
            <option value="hebrew">Hebrew</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Strong&apos;s number</label>
          <input value={strongs} onChange={(e) => setStrongs(e.target.value)} placeholder="G2540 or H1234" className="apple-field" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Definition</label>
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} rows={3} className="apple-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Extended notes (Markdown)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="apple-field" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Verse references (comma-separated)</label>
        <input
          value={verses}
          onChange={(e) => setVerses(e.target.value)}
          placeholder="John 3:16, Romans 8:28"
          className="apple-field"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
