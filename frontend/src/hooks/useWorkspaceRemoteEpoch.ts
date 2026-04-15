import { useSyncExternalStore } from "react";

import { getWorkspaceEpoch, subscribeWorkspaceEpoch } from "@/lib/workspaceRemoteSync";

/** Bumps when remote workspace data was applied to localStorage (cross-device sync). */
export function useWorkspaceRemoteEpoch(): number {
  return useSyncExternalStore(subscribeWorkspaceEpoch, getWorkspaceEpoch, getWorkspaceEpoch);
}
