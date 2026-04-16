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

export function ReaderBibleMapPanel({ book, chapter, verse, onClose, fullBleed }: ReaderBibleMapPanelProps) {
  const ctx = `${book} ${chapter}`;

  return (
    <div
      className={
        fullBleed
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          : "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <WorkspaceMapsGallery
          variant="reader"
          readerContext={ctx}
          onCloseReader={onClose}
          matchBook={book}
          matchChapter={chapter}
          matchVerse={verse}
        />
      </div>
    </div>
  );
}
