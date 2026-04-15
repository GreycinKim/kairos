import { BIBLE_VERSION_IDS, type BibleVersionId } from "@/lib/bibleVersions";
import clsx from "clsx";

export function BibleVersionSelect({
  value,
  onChange,
  className,
  size = "md",
}: {
  value: BibleVersionId;
  onChange: (v: BibleVersionId) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <select
      aria-label="Bible translation"
      value={value}
      onChange={(e) => onChange(e.target.value as BibleVersionId)}
      className={clsx(
        "cursor-pointer rounded-lg border border-neutral-200 bg-white font-semibold text-neutral-800 shadow-sm outline-none transition-colors hover:border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200",
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
        className,
      )}
    >
      {BIBLE_VERSION_IDS.map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
}
