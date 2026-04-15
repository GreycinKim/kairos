import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useWorkspaceRemoteEpoch } from "@/hooks/useWorkspaceRemoteEpoch";
import { loadEventScripture } from "@/lib/eventScripture";
import { loadPlaces } from "@/lib/places";
import { collectCrossLinksForPassages, type ScriptureCrossLink } from "@/lib/scriptureConnections";
import { loadPeopleProfiles, type ScriptureAppearance } from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

function kindLabel(kind: ScriptureCrossLink["kind"]): string {
  switch (kind) {
    case "person":
      return "Person";
    case "place":
      return "Place";
    case "timeline_event":
      return "Event";
    default:
      return "";
  }
}

function LinksList({ links }: { links: ScriptureCrossLink[] }) {
  if (!links.length) return <p className="text-sm text-muted-foreground">Nothing else is tagged to this passage yet.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {links.map((r) => (
        <li key={`${r.kind}-${r.id}-${r.chapterLabel}`}>
          <Link
            to={r.href}
            className="flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 px-3 py-2.5 text-left text-sm hover:bg-muted/50"
          >
            <span className="font-medium text-foreground">{r.label}</span>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{kindLabel(r.kind)}</span>
            <span className="ml-auto text-xs text-muted-foreground">{r.chapterLabel}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Cross-links for many book+chapter rows (deduped), with optional exclusions. */
export function ScriptureCrossLinksBlock({
  passages,
  excludeEventId,
  excludePlaceId,
  title = "Linked by scripture",
  description = "People, places, and timeline events that share at least one of these passages.",
  className = "",
}: {
  passages: ScriptureAppearance[];
  excludeEventId?: string;
  excludePlaceId?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const workspaceEpoch = useWorkspaceRemoteEpoch();
  const events = useTimelineStore((s) => s.events);
  const links = useMemo(() => {
    if (!passages.length) return [];
    const profiles = loadPeopleProfiles();
    const places = loadPlaces();
    const eventScriptureMap = loadEventScripture();
    return collectCrossLinksForPassages(passages, {
      events,
      profiles,
      places,
      eventScriptureMap,
      excludeEventId,
      excludePlaceId,
    });
  }, [passages, events, excludeEventId, excludePlaceId, workspaceEpoch]);

  if (!passages.length) return null;
  if (!links.length) return null;

  return (
    <section className={className}>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{description}</p>
      <LinksList links={links} />
    </section>
  );
}
