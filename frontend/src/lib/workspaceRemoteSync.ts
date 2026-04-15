import { api } from "@/api/client";
import { readAuthSession } from "@/lib/authSession";
import { EVENT_SCRIPTURE_STORAGE_KEY, loadEventScripture } from "@/lib/eventScripture";
import { ATLAS_ROUTES_STORAGE_KEY, loadAtlasRoutes } from "@/lib/mapAtlasOverlays";
import { EVENT_DISPLAY_STORAGE_KEY, loadEventDisplay } from "@/lib/timelineEventDisplay";

/** Workspace row now only syncs atlas routes + per-event reader display fields (people/places live in `/library`). */
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
/** If the server row is still empty but this device has data, retry upload (handles failed first push). */
const EMPTY_REMOTE_REPAIR_INTERVAL_MS = 25_000;
/** Pre–per-user workspaces used a single `default` row in Postgres. */
const LEGACY_DEFAULT_WORKSPACE_KEY = "default";

let silencePushUntil = 0;
let lastEmptyRemoteRepairPush = 0;

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
    people_profiles: {},
    places: {},
    event_display: loadEventDisplay() as Record<string, unknown>,
    event_scripture: loadEventScripture() as Record<string, unknown>,
    atlas_routes: loadAtlasRoutes() as unknown[],
  };
}

function remoteSyncSliceEmpty(data: WorkspaceClientStatePayload): boolean {
  return (
    Object.keys(data.event_display ?? {}).length === 0 &&
    Object.keys(data.event_scripture ?? {}).length === 0 &&
    (data.atlas_routes?.length ?? 0) === 0
  );
}

function localSyncSliceHasData(): boolean {
  const s = snapshotFromLocalStorage();
  return (
    Object.keys(s.event_display).length > 0 ||
    Object.keys(s.event_scripture).length > 0 ||
    s.atlas_routes.length > 0
  );
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
  return remoteSyncSliceEmpty(data);
}

function localWorkspaceHasAnyData(): boolean {
  return localSyncSliceHasData();
}

export async function pullWorkspaceFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { data } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state");
    if (!data?.updated_at) return false;
    if (data.updated_at === lastSeenRemoteUpdatedAt) return false;

    if (isRemotePayloadEmpty(data) && localWorkspaceHasAnyData()) {
      const now = Date.now();
      if (now - lastEmptyRemoteRepairPush >= EMPTY_REMOTE_REPAIR_INTERVAL_MS) {
        lastEmptyRemoteRepairPush = now;
        await pushFullWorkspaceToServer();
      }
      return false;
    }

    try {
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

/**
 * After introducing per-login workspace keys, copy server data from the old singleton row into this
 * account’s row when the new row is empty, this device has no local workspace yet, and `default` still has data.
 */
export async function hydrateFromLegacyDefaultWorkspaceRow(): Promise<void> {
  const u = readAuthSession()?.username?.trim();
  if (!u) return;
  try {
    const { data: keyed } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state");
    if (!keyed?.updated_at || !remoteSyncSliceEmpty(keyed)) return;
    if (localSyncSliceHasData()) return;

    const { data: legacy } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state", {
      headers: { "X-Kairos-Workspace-Key": LEGACY_DEFAULT_WORKSPACE_KEY },
    });
    if (!legacy?.updated_at || remoteSyncSliceEmpty(legacy)) return;

    try {
      window.localStorage.setItem(EVENT_DISPLAY_STORAGE_KEY, JSON.stringify(legacy.event_display ?? {}));
      window.localStorage.setItem(EVENT_SCRIPTURE_STORAGE_KEY, JSON.stringify(legacy.event_scripture ?? {}));
      window.localStorage.setItem(ATLAS_ROUTES_STORAGE_KEY, JSON.stringify(legacy.atlas_routes ?? []));
    } catch (e) {
      console.warn("[workspace sync] legacy hydrate could not write localStorage", e);
      return;
    }

    bumpWorkspaceEpoch();
    await pushFullWorkspaceToServer();
  } catch {
    /* offline or API missing */
  }
}

/** Initial upload if server row is empty but this device has local sync-slice data (migration path). */
export async function pushLocalToServerIfRemoteEmpty(): Promise<void> {
  try {
    const { data } = await api.get<WorkspaceClientStatePayload>("/workspace/client-state");
    if (!data) return;
    const remoteEmpty = remoteSyncSliceEmpty(data);
    const localHas = localSyncSliceHasData();
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
