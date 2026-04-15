import type { PersonProfile, ScriptureAppearance } from "@/lib/timelinePeople";
import type { TimelineEvent } from "@/types";
import { notifyWorkspaceLocalChanged } from "@/lib/workspaceRemotePushSchedule";

export const EVENT_SCRIPTURE_STORAGE_KEY = "kairos-timeline-event-scripture-v1";
const LS_KEY = EVENT_SCRIPTURE_STORAGE_KEY;

export type EventScriptureMap = Record<string, ScriptureAppearance[]>;

export function loadEventScripture(): EventScriptureMap {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EventScriptureMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveEventScripture(data: EventScriptureMap) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
    notifyWorkspaceLocalChanged();
  } catch {
    /* ignore */
  }
}

/** Scripture rows for a timeline event: people/rulers use the profile; other types use local storage. */
export function getScripturesForTimelineEvent(
  event: TimelineEvent,
  profile: PersonProfile | undefined,
  map: EventScriptureMap,
): ScriptureAppearance[] {
  if (event.type === "person" || event.type === "ruler") {
    return profile?.scriptureAppearances ?? [];
  }
  return map[event.id] ?? [];
}

export function setScripturesForTimelineEvent(
  map: EventScriptureMap,
  event: TimelineEvent,
  rows: ScriptureAppearance[],
): EventScriptureMap {
  if (event.type === "person" || event.type === "ruler") {
    return map;
  }
  const next = { ...map };
  if (!rows.length) delete next[event.id];
  else next[event.id] = rows;
  return next;
}

export function deleteEventScriptureEntry(map: EventScriptureMap, eventId: string): EventScriptureMap {
  if (!map[eventId]) return map;
  const next = { ...map };
  delete next[eventId];
  return next;
}

export function pruneEventScriptureForEventIds(map: EventScriptureMap, ids: Set<string>): EventScriptureMap {
  if (!ids.size) return map;
  let touched = false;
  const next = { ...map };
  for (const id of ids) {
    if (next[id]) {
      delete next[id];
      touched = true;
    }
  }
  return touched ? next : map;
}
