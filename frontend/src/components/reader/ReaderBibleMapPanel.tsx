import { useState } from "react";

import { BookCitiesSimpleMap } from "@/components/maps/BookCitiesSimpleMap";
import { WorkspaceMapsGallery } from "@/components/maps/WorkspaceMapsGallery";

type ReaderBibleMapPanelProps = {
  book: string;
  chapter: number;
  /** Optional verse for map tiering (e.g. Luke 9:51). */
  verse?: number;
  onClose: () => void;
  /** When true, fills the viewport (mobile overlay). */
  fullBleed?: boolean;
};

type MapPanelMode = "workspace" | "book-cities";

export function ReaderBibleMapPanel({ book, chapter, verse, onClose, fullBleed }: ReaderBibleMapPanelProps) {
  const ctx = `${book} ${chapter}`;
  const [mode, setMode] = useState<MapPanelMode>("workspace");
  const mapsPageHref = `/scripture/maps?book=${encodeURIComponent(book)}&chapter=${String(chapter)}`;

  return (
    <div
      className={
        fullBleed
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          : "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
      }
    >
      <div className="flex shrink-0 gap-0.5 border-b border-neutral-200 bg-neutral-100/90 p-1">
        <button
          type="button"
          onClick={() => setMode("workspace")}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition-colors ${
            mode === "workspace" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Workspace plate
        </button>
        <button
          type="button"
          onClick={() => setMode("book-cities")}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-[11px] font-semibold transition-colors ${
            mode === "book-cities" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Book cities
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === "workspace" ? (
          <WorkspaceMapsGallery
            variant="reader"
            readerContext={ctx}
            onCloseReader={onClose}
            matchBook={book}
            matchChapter={chapter}
            matchVerse={verse}
          />
        ) : (
          <BookCitiesSimpleMap book={book} chapter={chapter} onClose={onClose} atlasBrowseHref={mapsPageHref} />
        )}
      </div>
    </div>
  );
}
