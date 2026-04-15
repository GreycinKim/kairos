import type { WordStudy } from "@/types";

import { WordStudyCard } from "./WordStudyCard";

export function WordStudyList({
  items,
  onSelect,
}: {
  items: WordStudy[];
  onSelect: (ws: WordStudy) => void;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No word studies match your search.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((ws) => (
        <WordStudyCard key={ws.id} ws={ws} onClick={() => onSelect(ws)} />
      ))}
    </div>
  );
}
