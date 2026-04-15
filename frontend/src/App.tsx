import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2, Sidebar } from "lucide-react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { KairosJbchRail } from "@/components/layout/KairosJbchRail";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JournalPage } from "@/pages/JournalPage";
import { NotesPage } from "@/pages/NotesPage";
import { PrayerPage } from "@/pages/PrayerPage";
import { BibleMapPage } from "@/pages/BibleMapPage";
import { FeastsOfferingsStudyPage } from "@/pages/FeastsOfferingsStudyPage";
import { FourGospelsStudyPage } from "@/pages/FourGospelsStudyPage";
import { ParallelGospelsPage } from "@/pages/ParallelGospelsPage";
import { ScriptureFlowStudioPage } from "@/pages/ScriptureFlowStudioPage";
import { SearchPage } from "@/pages/SearchPage";
import { TimelineImportPage } from "@/pages/timeline/TimelineImportPage";
import { TimelineEditPersonPage } from "@/pages/timeline/TimelineEditPersonPage";
import { TimelineEventPage } from "@/pages/timeline/TimelineEventPage";
import { TimelineNewEventPage } from "@/pages/timeline/TimelineNewEventPage";
import { TimelineNewPersonPage } from "@/pages/timeline/TimelineNewPersonPage";
import { TimelinePersonPage } from "@/pages/timeline/TimelinePersonPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { PlacesPage } from "@/pages/PlacesPage";
import { PlaceDetailPage } from "@/pages/places/PlaceDetailPage";
import { PlaceEditPage } from "@/pages/places/PlaceEditPage";
import { PlacesImportPage } from "@/pages/places/PlacesImportPage";
import { TimelinePage } from "@/pages/TimelinePage";
import { WordStudyPage } from "@/pages/WordStudyPage";
import { JbchHubPage } from "@/pages/JbchHubPage";
import { ReadingHomePage } from "@/pages/ReadingHomePage";
import { LoginPage } from "@/pages/LoginPage";
import { LibraryDataHydrationHost } from "@/components/workspace/LibraryDataHydrationHost";
import { WorkspaceRemoteSyncHost } from "@/components/workspace/WorkspaceRemoteSyncHost";

function JbchHubLegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}

const RAIL_STORAGE_KEY = "kairos-nav-rail-visible";

function AppShell() {
  const { pathname } = useLocation();
  const readerHome = pathname === "/" || pathname === "/home";
  const bibleMapFullBleed = pathname === "/scripture/maps";
  const peopleOrPersonLoreFullBleed = pathname === "/people" || pathname.startsWith("/timeline/person");
  const placesFullBleed = pathname.startsWith("/places");
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(RAIL_STORAGE_KEY) !== "0";
  });

  const setRailOpenPersist = (open: boolean) => {
    setRailOpen(open);
    try {
      window.localStorage.setItem(RAIL_STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* ignore quota */
    }
  };

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-background">
      {railOpen ? <KairosJbchRail onRequestCollapse={() => setRailOpenPersist(false)} /> : null}
      <main
        className={
          readerHome || bibleMapFullBleed || peopleOrPersonLoreFullBleed || placesFullBleed
            ? "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
            : "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background"
        }
      >
        {!railOpen ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-3 top-3 z-20 h-9 w-9 rounded-full border border-black/[0.08] bg-card shadow-sm"
            onClick={() => setRailOpenPersist(true)}
            aria-label="Show navigation sidebar"
          >
            <Sidebar className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        ) : null}
        <LibraryDataHydrationHost />
        <WorkspaceRemoteSyncHost />
        <Routes>
          <Route path="/" element={<JbchHubPage />} />
          <Route path="/home" element={<ReadingHomePage />} />
          <Route path="/jbch-hub" element={<JbchHubLegacyRedirect />} />
          <Route path="/timeline/person/new" element={<TimelineNewPersonPage />} />
          <Route path="/timeline/person/:eventId/edit" element={<TimelineEditPersonPage />} />
          <Route path="/timeline/person/:eventId" element={<TimelinePersonPage />} />
          <Route path="/timeline/event/new" element={<TimelineNewEventPage />} />
          <Route path="/timeline/event/:eventId" element={<TimelineEventPage />} />
          <Route path="/timeline/import" element={<TimelineImportPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/places/import" element={<PlacesImportPage />} />
          <Route path="/places/new" element={<PlaceEditPage />} />
          <Route path="/places/:placeId/edit" element={<PlaceEditPage />} />
          <Route path="/places/:placeId" element={<PlaceDetailPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/spiritual-timeline" element={<Navigate to="/timeline" replace />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/word-study" element={<WordStudyPage />} />
          <Route path="/word-studies" element={<Navigate to="/word-study" replace />} />
          <Route path="/scripture" element={<Navigate to="/scripture/flow" replace />} />
          <Route path="/scripture/flow" element={<ScriptureFlowStudioPage />} />
          <Route path="/scripture/maps" element={<BibleMapPage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/notes/gospels-guide" element={<FourGospelsStudyPage />} />
          <Route path="/notes/feasts-offerings-guide" element={<FeastsOfferingsStudyPage />} />
          <Route path="/reader/parallel-gospels" element={<ParallelGospelsPage />} />
          <Route path="/themes" element={<Navigate to="/timeline" replace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthRoutes() {
  const { authed, ready } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!authed) {
    const redirectState = { from: `${loc.pathname}${loc.search}` };
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace state={redirectState} />} />
      </Routes>
    );
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={400} skipDelayDuration={200}>
          <AuthRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
