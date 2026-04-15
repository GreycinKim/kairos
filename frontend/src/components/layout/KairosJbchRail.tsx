import { Fragment } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  ChevronsLeft,
  Clock,
  Feather,
  Heart,
  Library,
  GitBranch,
  ListOrdered,
  Map,
  MapPin,
  Search,
  Sparkles,
  Users,
  LogOut,
} from "lucide-react";

import clsx from "clsx";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { isAuthDisabled } from "@/lib/authSession";

const JBCH_ORANGE = "#ff8c00";

const PRIMARY: { to: string; label: string; icon: typeof BookOpen; end?: boolean }[] = [
  { to: "/", label: "Reader", icon: BookOpen, end: true },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/journal", label: "Journal", icon: Feather },
  { to: "/word-study", label: "Word studies", icon: Library },
  { to: "/scripture/flow", label: "Sermon map", icon: GitBranch },
  { to: "/scripture/maps", label: "Maps", icon: Map },
  { to: "/prayer", label: "Prayer", icon: Heart },
  { to: "/notes", label: "Notes", icon: Sparkles },
  { to: "/search", label: "Search", icon: Search },
];

const READER_TABS: { tab: string; label: string; icon: typeof ListOrdered }[] = [
  { tab: "index", label: "Bible index", icon: BookOpen },
  { tab: "dictionary", label: "Dictionary", icon: Library },
  { tab: "recitation", label: "Recitation", icon: ListOrdered },
];

function mergeReaderTabSearch(searchParams: URLSearchParams, tab: string): string {
  const sp = new URLSearchParams(searchParams);
  sp.set("tab", tab);
  return `/?${sp.toString()}`;
}

export function KairosJbchRail({ onRequestCollapse }: { onRequestCollapse?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const authDisabled = isAuthDisabled();
  const onReader = pathname === "/";
  const onReadingHome = pathname === "/home";
  const mapsPeopleActive = pathname === "/people" || pathname.startsWith("/timeline/person");
  const mapsPlacesActive = pathname.startsWith("/places");

  return (
    <aside className="flex h-[100dvh] min-h-0 w-[220px] shrink-0 flex-col border-r border-neutral-800 bg-[#1a1a1a] text-neutral-200">
      <div className="flex shrink-0 items-center gap-2 px-3 py-4 sm:px-4 sm:py-5">
        <Link
          to="/home?view=chart"
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-[#1a1a1a] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-400",
            onReadingHome && "ring-2 ring-white ring-offset-2",
          )}
          style={{ backgroundColor: JBCH_ORANGE }}
          title="Reading home"
          aria-label="Open reading home dashboard"
        >
          K
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-white">Kairos</h1>
          <p className="truncate text-xs text-neutral-500">Reader &amp; history</p>
        </div>
        {onRequestCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-neutral-400 hover:bg-white/10 hover:text-white"
            onClick={onRequestCollapse}
            aria-label="Hide navigation sidebar"
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 pb-2">
        {PRIMARY.map(({ to, label, icon: Icon, end }) => (
          <Fragment key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
              {label}
            </NavLink>
            {to === "/scripture/maps" ? (
              <>
                <NavLink
                  to="/people"
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg py-2 pl-8 pr-3 text-left text-sm font-medium transition-colors",
                      mapsPeopleActive || isActive
                        ? "bg-white/10 text-white"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                    )
                  }
                >
                  <Users className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  People
                </NavLink>
                <NavLink
                  to="/places"
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg py-2 pl-8 pr-3 text-left text-sm font-medium transition-colors",
                      mapsPlacesActive || isActive
                        ? "bg-white/10 text-white"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                    )
                  }
                >
                  <MapPin className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  Places
                </NavLink>
              </>
            ) : null}
          </Fragment>
        ))}

        {onReader ? (
          <>
            <div className="my-2 border-t border-white/10" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Reader</p>
            {READER_TABS.map(({ tab, label, icon: Icon }) => {
              const active = (searchParams.get("tab") || "index") === tab;
              return (
                <NavLink
                  key={tab}
                  to={mergeReaderTabSearch(searchParams, tab)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  {label}
                </NavLink>
              );
            })}
          </>
        ) : null}
      </nav>

      {!authDisabled ? (
        <div className="shrink-0 border-t border-white/10 px-2 py-3">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full justify-start gap-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
            Sign out
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
