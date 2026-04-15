import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { JournalEntryForm } from "@/components/journal/JournalEntry";
import { JournalList } from "@/components/journal/JournalList";
import { useJournalStore } from "@/store/journalStore";

export function JournalPage() {
  const [searchParams] = useSearchParams();
  const fetchEntries = useJournalStore((s) => s.fetchEntries);
  const entries = useJournalStore((s) => s.entries);

  const [dateStr, setDateStr] = useState(() => format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const d = searchParams.get("date");
    if (d) setDateStr(d);
  }, [searchParams]);

  return (
    <div className="flex min-h-0 flex-1 gap-8 px-6 py-8 sm:px-10">
      <div className="w-full max-w-xs shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Journal</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          SOAP journaling (Scripture, Observation, Application, Prayer).
        </p>
        <label className="mt-6 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
        <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="apple-field mt-2" />
        <h2 className="mb-2 mt-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent entries</h2>
        <JournalList entries={entries} selectedDate={dateStr} onSelectDate={setDateStr} />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-black/[0.06] bg-card p-6 shadow-card sm:p-8">
        <JournalEntryForm key={dateStr} dateStr={dateStr} />
      </div>
    </div>
  );
}
