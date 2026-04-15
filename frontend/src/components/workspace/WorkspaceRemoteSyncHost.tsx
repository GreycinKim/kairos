import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { flushPlacesSaveNow } from "@/lib/places";
import { flushPeopleProfilesSaveNow } from "@/lib/timelinePeople";
import { flushWorkspacePushNow } from "@/lib/workspaceRemotePushSchedule";
import {
  hydrateFromLegacyDefaultWorkspaceRow,
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
      await hydrateFromLegacyDefaultWorkspaceRow();
      if (cancelled) return;
      await pushLocalToServerIfRemoteEmpty();
      if (cancelled) return;
      await pullWorkspaceFromServer();
    })();
    const stopPoll = startWorkspaceRemotePolling();

    const flushOnBackground = () => {
      if (document.visibilityState === "hidden") {
        flushWorkspacePushNow();
        flushPeopleProfilesSaveNow();
        flushPlacesSaveNow();
      }
    };
    const flushOnLeave = () => {
      flushWorkspacePushNow();
      flushPeopleProfilesSaveNow();
      flushPlacesSaveNow();
    };
    document.addEventListener("visibilitychange", flushOnBackground);
    window.addEventListener("pagehide", flushOnLeave);

    return () => {
      cancelled = true;
      stopPoll();
      document.removeEventListener("visibilitychange", flushOnBackground);
      window.removeEventListener("pagehide", flushOnLeave);
      flushWorkspacePushNow();
    };
  }, [ready, authed]);

  return null;
}
