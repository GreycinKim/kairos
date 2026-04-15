/** Client-side portrait / icon overrides for any timeline event (people, milestones, books, etc.). */

export type EventDisplayOverride = {
  imageDataUrl?: string | null;
};

const LS_KEY = "kairos-timeline-event-display-v1";

export function loadEventDisplay(): Record<string, EventDisplayOverride> {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, EventDisplayOverride>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveEventDisplay(data: Record<string, EventDisplayOverride>) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
