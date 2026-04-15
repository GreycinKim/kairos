import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { JournalEntry as JE } from "@/types";
import { useJournalStore } from "@/store/journalStore";

import { EMPTY_SOAP, parseSoapBody, serializeSoapBody, type SoapBody } from "@/lib/journalSoap";
import { TiptapEditor } from "./TiptapEditor";

interface JournalEntryProps {
  dateStr: string;
}

export function JournalEntryForm({ dateStr }: JournalEntryProps) {
  const saveEntry = useJournalStore((s) => s.saveEntry);
  const [entryId, setEntryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [soap, setSoap] = useState<SoapBody>({ ...EMPTY_SOAP });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<JE | null>(`/journal/entries/by-date/${dateStr}`);
        if (data) {
          setEntryId(data.id);
          setTitle(data.title ?? "");
          setSoap(parseSoapBody(data.body));
        } else {
          setEntryId(undefined);
          setTitle("");
          setSoap({ ...EMPTY_SOAP });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [dateStr]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const result = await saveEntry({
        id: entryId,
        entry_date: dateStr,
        title: title || null,
        body: serializeSoapBody(soap),
      });
      if (result) {
        setEntryId(result.id);
        setSavedAt(new Date().toLocaleTimeString());
      }
    } finally {
      setSaving(false);
    }
  }, [dateStr, entryId, saveEntry, soap, title]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading entry�</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{format(new Date(dateStr + "T12:00:00"), "EEEE, MMMM d, yyyy")}</p>
        <div className="flex items-center gap-3">
          {savedAt ? <span className="text-[11px] text-muted-foreground">Last saved {savedAt}</span> : null}
          <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving�" : "Save entry"}
          </Button>
        </div>
      </div>
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="text-lg font-medium"
      />
      <div>
        <h2 className="mb-1 text-sm font-semibold tracking-tight text-foreground">SOAP</h2>
        <p className="mb-4 text-xs text-muted-foreground">Scripture � Observation � Application � Prayer</p>
        {(
          [
            ["scripture", "Scripture"] as const,
            ["observation", "Observation"] as const,
            ["application", "Application"] as const,
            ["prayer", "Prayer"] as const,
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="mb-5 last:mb-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <TiptapEditor
              key={`${dateStr}-${key}`}
              value={soap[key]}
              onChange={(html) => setSoap((s) => ({ ...s, [key]: html }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
