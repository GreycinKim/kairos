import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { hydratePlacesFromServer } from "@/lib/places";
import { migrateReadingLogLocalToServer, refreshReadingLogFromServer } from "@/lib/readingLog";
import { hydratePeopleProfilesFromServer } from "@/lib/timelinePeople";
import { bumpWorkspaceEpoch } from "@/lib/workspaceRemoteSync";

/**
 * Loads people profiles, places, and reading log from Postgres into localStorage (cache),
 * or uploads local-only data when the server tables are still empty.
 */
export function LibraryDataHydrationHost() {
  const { authed, ready } = useAuth();

  useEffect(() => {
    if (!ready || !authed) return;
    let cancelled = false;
    void (async () => {
      await Promise.all([hydratePeopleProfilesFromServer(), hydratePlacesFromServer()]);
      if (cancelled) return;
      await refreshReadingLogFromServer();
      if (cancelled) return;
      await migrateReadingLogLocalToServer();
      if (cancelled) return;
      bumpWorkspaceEpoch();
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authed]);

  return null;
}
