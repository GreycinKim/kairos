import type { TimelineEvent } from "@/types";

export function deepDivePathForEvent(ev: TimelineEvent): string {
  if (ev.type === "bible_book") {
    return `/?book=${encodeURIComponent(ev.title)}&chapter=1&tab=outline`;
  }
  if (ev.type === "person" || ev.type === "ruler") {
    return `/timeline/person/${encodeURIComponent(ev.id)}`;
  }
  const t = ev.title.toLowerCase();
  if (t.includes("gospel")) return "/notes/gospels-guide";
  if (t.includes("feast") || t.includes("offering")) return "/notes/feasts-offerings-guide";
  return `/timeline/event/${encodeURIComponent(ev.id)}`;
}
