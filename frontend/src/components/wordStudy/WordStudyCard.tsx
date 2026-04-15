import type { WordStudy } from "@/types";

export function WordStudyCard({ ws, onClick }: { ws: WordStudy; onClick: () => void }) {
  const lang = ws.language?.toLowerCase() === "hebrew" ? "Hebrew" : ws.language?.toLowerCase() === "greek" ? "Greek" : "—";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-black/[0.06] bg-card p-4 text-left shadow-sm transition-all duration-200 ease-out hover:border-primary/20 hover:shadow-float"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground">{ws.word}</span>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {lang}
        </span>
      </div>
      {ws.transliteration ? (
        <p className="mt-1 text-sm italic text-muted-foreground">{ws.transliteration}</p>
      ) : null}
      {ws.strongs_number ? (
        <p className="mt-2 text-xs font-medium text-primary">Strong&apos;s {ws.strongs_number}</p>
      ) : null}
      {ws.definition ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{ws.definition}</p> : null}
    </button>
  );
}
