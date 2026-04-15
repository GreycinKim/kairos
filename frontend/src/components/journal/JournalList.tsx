import { format } from "date-fns";

import type { JournalEntry } from "@/types";

export function JournalList({
  entries,
  selectedDate,
  onSelectDate,
}: {
  entries: JournalEntry[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}) {
  return (
    <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-2">
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => onSelectDate(e.entry_date)}
          className={`flex w-full flex-col rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ease-out ${
            e.entry_date === selectedDate
              ? "border-primary/25 bg-primary/8 shadow-sm"
              : "border-transparent hover:bg-black/[0.03]"
          }`}
        >
          <span className="text-xs text-muted-foreground">
            {format(new Date(e.entry_date + "T12:00:00"), "MMM d, yyyy")}
          </span>
          <span className="font-medium text-foreground">{e.title || "Untitled entry"}</span>
        </button>
      ))}
    </div>
  );
}
