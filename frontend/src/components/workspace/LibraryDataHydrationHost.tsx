import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { hydrateChapterAtlasFromServer } from "@/lib/chapterAtlasState";
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
    const runSync = async () => {
      await Promise.all([
        hydratePeopleProfilesFromServer(),
        hydratePlacesFromServer(),
        hydrateChapterAtlasFromServer(),
      ]);
      if (cancelled) return;
      await refreshReadingLogFromServer();
      if (cancelled) return;
      await migrateReadingLogLocalToServer();
      if (cancelled) return;
      bumpWorkspaceEpoch();
    };
    void runSync();
    const pollId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void runSync();
    }, 15000);
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void runSync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, authed]);

  return null;
}
