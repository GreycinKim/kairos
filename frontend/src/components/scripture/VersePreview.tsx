import { useEffect, useState } from "react";

import { api } from "@/api/client";

export function VersePreview({
  book,
  chapter,
  verse,
  translation = "ESV",
  children,
}: {
  book: string;
  chapter: number;
  verse: number;
  /** ESV, LSB, NKJV, or KJV (passed to /scripture/verse-text). */
  translation?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void (async () => {
      try {
        const { data } = await api.get<{ text: string; reference: string; translation: string }>(
          "/scripture/verse-text",
          { params: { book, chapter, verse_start: verse, verse_end: verse, translation } },
        );
        setText(data.text);
      } catch {
        setText("Could not load verse text.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, book, chapter, verse, translation]);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="border-b border-dotted border-primary/50 text-primary transition-colors duration-200 ease-out hover:border-primary hover:text-primary/85"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-black/[0.08] bg-white/95 p-3 text-left shadow-float backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {book} {chapter}:{verse}
          </p>
          {loading ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
          ) : (
            <p className="mt-2 text-sm font-serif leading-relaxed text-foreground">{text}</p>
          )}
        </div>
      ) : null}
    </span>
  );
}
