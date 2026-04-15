import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  pullWorkspaceFromServer,
  pushLocalToServerIfRemoteEmpty,
  startWorkspaceRemotePolling,
} from "@/lib/workspaceRemoteSync";

/**
 * Keeps people profiles, places, event display/scripture, and atlas routes aligned with Postgres
 * for this deployment (same URL on laptop + iPad). Mount only when authenticated.
 */
export function WorkspaceRemoteSyncHost() {
  const { authed, ready } = useAuth();

  useEffect(() => {
    if (!ready || !authed) return;
    let cancelled = false;
    void (async () => {
      await pushLocalToServerIfRemoteEmpty();
      if (cancelled) return;
      await pullWorkspaceFromServer();
    })();
    const stopPoll = startWorkspaceRemotePolling();
    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [ready, authed]);

  return null;
}
