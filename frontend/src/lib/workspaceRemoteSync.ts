import { api } from "@/api/client";
import { EVENT_SCRIPTURE_STORAGE_KEY, loadEventScripture } from "@/lib/eventScripture";
import { ATLAS_ROUTES_STORAGE_KEY, loadAtlasRoutes } from "@/lib/mapAtlasOverlays";
import { PLACES_STORAGE_KEY, loadPlaces } from "@/lib/places";
import { EVENT_DISPLAY_STORAGE_KEY, loadEventDisplay } from "@/lib/timelineEventDisplay";
import { PEOPLE_PROFILES_STORAGE_KEY, loadPeopleProfiles } from "@/lib/timelinePeople";

export type WorkspaceClientStatePayload = {
  workspace_key: string;
  people_profiles: Record<string, unknown>;
  places: Record<string, unknown>;
  event_display: Record<string, unknown>;
  event_scripture: Record<string, unknown>;
  atlas_routes: unknown[];
  updated_at: string;
};

const POLL_MS = 5000;

let silencePushUntil = 0;

/** After applying remote data, skip pushing the same snapshot back for a short window. */
export function markRemoteWorkspaceApplied(): void {
  silencePushUntil = Date.now() + 2500;
}

let workspaceEpoch = 0;
const epochListeners = new Set<() => void>();

function subscribeWorkspaceEpoch(onStoreChange: () => void): () => void {
  epochListeners.add(onStoreChange);
  return () => epochListeners.delete(onStoreChange);
}

function getWorkspaceEpoch(): number {
  return workspaceEpoch;
}

function bumpWorkspaceEpoch(): void {
  workspaceEpoch += 1;
  for (const cb of epochListeners) cb();
}

export { subscribeWorkspaceEpoch, getWorkspaceEpoch, bumpWorkspaceEpoch };

let lastSeenRemoteUpdatedAt: string | null = null;

function snapshotFromLocalStorage(): Omit<WorkspaceClientStatePayload, "workspace_key" | "updated_at"> {
  return {
    people_profiles: loadPeopleProfiles() as Record<string, unknown>,
    places: loadPlaces() as Record<string, unknown>,
    event_display: loadEventDisplay() as Record<string, unknown>,
    event_scripture: loadEventScripture() as Record<string, unknown>,
    atlas_routes: loadAtlasRoutes() as unknown[],
  };
}

export async function pushFullWorkspaceToServer(): Promise<void> {
  if (typeof window === "undefined") return;
  if (Date.now() < silencePushUntil) return;
  try {
    const body = snapshotFromLocalStorage();
    const { data } = await api.put<WorkspaceClientStatePayload>("/workspace/client-state", body);
    if (data?.updated_at) lastSeenRemoteUpdatedAt = data.updated_at;
  } catch (e) {
    console.warn("[workspace sync] push failed", e);
  }
}

function isRemotePayloadEmpty(data: WorkspaceClientStatePayload): boolean {
  return (
    Object.keys(data.people_profiles ?? {}).length === 0 &&
    Object.keys(data.places ?? {}).length === 0 &&
    Object.keys(data.event_display ?? {}).length === 0 &&
    Object.keys(data.event_scripture ?? {}).length === 0 &&
    (data.atlas_routes?.length ?? 0) === 0
  );
}

function localWorkspaceHasAnyData(): boolean {
  const s = snapshotFromLocalStorage();
  return (
    Object.keys(s.people_profiles).length > 0 ||
    Object.keys(s.places).length > 0 ||
    Object.keys(s.event_display).length > 0 ||
    Object.keys(s.event_scripture).length > 0 ||
    s.atlas_routes.length > 0
  );
}

export async function pullWorkspaceFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { data } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state");
    if (!data?.updated_at) return false;
    if (data.updated_at === lastSeenRemoteUpdatedAt) return false;

    if (isRemotePayloadEmpty(data) && localWorkspaceHasAnyData()) {
      return false;
    }

    try {
      window.localStorage.setItem(PEOPLE_PROFILES_STORAGE_KEY, JSON.stringify(data.people_profiles ?? {}));
      window.localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(data.places ?? {}));
      window.localStorage.setItem(EVENT_DISPLAY_STORAGE_KEY, JSON.stringify(data.event_display ?? {}));
      window.localStorage.setItem(EVENT_SCRIPTURE_STORAGE_KEY, JSON.stringify(data.event_scripture ?? {}));
      window.localStorage.setItem(ATLAS_ROUTES_STORAGE_KEY, JSON.stringify(data.atlas_routes ?? []));
    } catch (e) {
      console.warn("[workspace sync] could not write localStorage", e);
      return false;
    }

    lastSeenRemoteUpdatedAt = data.updated_at;
    markRemoteWorkspaceApplied();
    bumpWorkspaceEpoch();
    return true;
  } catch (e) {
    console.warn("[workspace sync] pull failed", e);
    return false;
  }
}

/** Initial upload if server row is empty but this device has local data (migration path). */
export async function pushLocalToServerIfRemoteEmpty(): Promise<void> {
  try {
    const { data } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state");
    if (!data) return;
    const remoteEmpty =
      Object.keys(data.people_profiles ?? {}).length === 0 &&
      Object.keys(data.places ?? {}).length === 0 &&
      Object.keys(data.event_display ?? {}).length === 0 &&
      Object.keys(data.event_scripture ?? {}).length === 0 &&
      (data.atlas_routes?.length ?? 0) === 0;
    const local = snapshotFromLocalStorage();
    const localHas =
      Object.keys(local.people_profiles).length > 0 ||
      Object.keys(local.places).length > 0 ||
      Object.keys(local.event_display).length > 0 ||
      Object.keys(local.event_scripture).length > 0 ||
      local.atlas_routes.length > 0;
    if (remoteEmpty && localHas) {
      await pushFullWorkspaceToServer();
    } else if (data.updated_at) {
      lastSeenRemoteUpdatedAt = data.updated_at;
    }
  } catch {
    /* offline or API missing */
  }
}

export function startWorkspaceRemotePolling(): () => void {
  if (typeof window === "undefined") return () => {};
  const tick = () => {
    if (document.visibilityState !== "visible") return;
    void pullWorkspaceFromServer();
  };
  const id = window.setInterval(tick, POLL_MS);
  document.addEventListener("visibilitychange", tick);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", tick);
  };
}
