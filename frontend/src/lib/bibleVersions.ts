export const BIBLE_VERSION_IDS = ["ESV", "LSB", "NKJV", "KJV"] as const;
export type BibleVersionId = (typeof BIBLE_VERSION_IDS)[number];

export function parseBibleVersion(raw: string | null | undefined): BibleVersionId {
  const u = (raw || "ESV").toUpperCase();
  return (BIBLE_VERSION_IDS as readonly string[]).includes(u) ? (u as BibleVersionId) : "ESV";
}
