import { Fragment } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { PanelLeftClose } from "lucide-react";

import clsx from "clsx";

const links: {
  to: string;
  label: string;
  icon: string;
  nested?: { to: string; label: string; icon: string }[];
}[] = [
  { to: "/timeline", label: "Timeline", icon: "⏳" },
  { to: "/journal", label: "Journal", icon: "📓" },
  { to: "/word-study", label: "Word studies", icon: "📖" },
  { to: "/scripture/flow", label: "Sermon map", icon: "🌿" },
  {
    to: "/scripture/maps",
    label: "Maps",
    icon: "🗺️",
    nested: [
      { to: "/people", label: "People", icon: "👥" },
      { to: "/places", label: "Places", icon: "📍" },
    ],
  },
  { to: "/", label: "Reader", icon: "📜" },
  { to: "/prayer", label: "Prayer", icon: "🙏" },
  { to: "/notes", label: "Notes", icon: "✍️" },
  { to: "/search", label: "Search", icon: "🔍" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  const mapsPeopleActive = pathname === "/people" || pathname.startsWith("/timeline/person");
  const mapsPlacesActive = pathname.startsWith("/places");

  return (
    <aside
      className={clsx(
        "sticky top-0 h-screen shrink-0 self-start overflow-hidden transition-[width] duration-300 ease-out",
        open ? "w-[15.5rem]" : "w-0",
      )}
      aria-hidden={!open}
    >
      <div className="glass-surface flex h-full w-[15.5rem] flex-col border-r border-black/[0.06]">
        <div className="flex items-start justify-between gap-2 border-b border-black/[0.06] px-5 py-6 pr-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Kairos</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Appointed time · unified history</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Hide navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-black/[0.06] hover:text-foreground"
          >
            <PanelLeftClose className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {links.map(({ to, label, icon, nested }) => (
            <Fragment key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium tracking-tight transition-all duration-200 ease-out",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
                  )
                }
              >
                <span className="text-[17px] opacity-80" aria-hidden>
                  {icon}
                </span>
                {label}
              </NavLink>
              {nested?.map((sub) => {
                const subActive =
                  sub.to === "/people"
                    ? mapsPeopleActive
                    : sub.to === "/places"
                      ? mapsPlacesActive
                      : pathname === sub.to;
                return (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 rounded-xl py-2.5 pl-9 pr-4 text-[14px] font-medium tracking-tight transition-all duration-200 ease-out",
                        subActive || isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground",
                      )
                    }
                  >
                    <span className="text-[16px] opacity-80" aria-hidden>
                      {sub.icon}
                    </span>
                    {sub.label}
                  </NavLink>
                );
              })}
            </Fragment>
          ))}
        </nav>
      </div>
    </aside>
  );
}
