import { Landmark, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { BookCitiesMapLibreMap } from "@/components/maps/BookCitiesMapLibreMap";
import { ROYAL_BURIAL_KINGS, ROYAL_BURIAL_SITES, type BurialCircumstance, type RoyalKingdom } from "@/lib/royalBurialsData";
import type { BibleMapLocationJson } from "@/lib/bookCitiesFromLocations";

const SITE_GROUP_STYLE: Record<string, string> = {
  judah: "bg-blue-100 text-blue-800",
  israel: "bg-violet-100 text-violet-800",
  mixed: "bg-teal-100 text-teal-800",
  unknown: "bg-stone-200 text-stone-700",
};

const KINGDOM_LABEL: Record<RoyalKingdom, string> = {
  judah: "Judah",
  israel: "Israel",
  unified: "Unified",
  mixed: "Mixed",
  unknown: "Unknown",
};

const CIRCUMSTANCE_STYLE: Record<BurialCircumstance, string> = {
  honored: "bg-emerald-100 text-emerald-800",
  standard: "bg-slate-100 text-slate-700",
  dishonored: "bg-amber-100 text-amber-800",
  violent: "bg-red-100 text-red-700",
  exile: "bg-blue-100 text-blue-800",
};

const CIRCUMSTANCE_LABEL: Record<BurialCircumstance, string> = {
  honored: "HONORED",
  standard: "STANDARD",
  dishonored: "DISHONORED",
  violent: "VIOLENT DEATH",
  exile: "EXILE/UNKNOWN",
};

export function RoyalBurialsPage() {
  const [query, setQuery] = useState("");
  const [openSites, setOpenSites] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();

  const kingsBySite = useMemo(() => {
    const grouped = new Map<string, typeof ROYAL_BURIAL_KINGS>();
    for (const king of ROYAL_BURIAL_KINGS) {
      if (!grouped.has(king.tomb)) grouped.set(king.tomb, []);
      grouped.get(king.tomb)!.push(king);
    }
    return grouped;
  }, []);

  const matchingSites = useMemo(() => {
    if (!q) return new Set(ROYAL_BURIAL_SITES.map((s) => s.key));
    return new Set(
      ROYAL_BURIAL_SITES.filter((site) =>
        (kingsBySite.get(site.key) ?? []).some((k) => k.name.toLowerCase().includes(q)),
      ).map((s) => s.key),
    );
  }, [q, kingsBySite]);

  const toggleSite = (siteKey: string) => {
    setOpenSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteKey)) next.delete(siteKey);
      else next.add(siteKey);
      return next;
    });
  };

  const totalKings = ROYAL_BURIAL_KINGS.length;
  const burialMapPlaces = useMemo<BibleMapLocationJson[]>(
    () =>
      ROYAL_BURIAL_SITES.map((site) => ({
        id: site.key,
        name: site.location,
        lat: site.lat,
        lng: site.lng,
        type: "city",
        description: `${site.name}. ${site.description}`,
      })),
    [],
  );

  return (
    <div className="min-h-[100dvh] bg-[#faf8f3] px-4 py-8 text-stone-800 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 rounded-2xl border border-stone-200 bg-white/85 px-5 py-5">
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Royal Burials of Ancient Israel</h1>
          <p className="mt-1 text-sm text-stone-600">1 Samuel - 2 Chronicles</p>
          <p className="mt-2 text-xs font-medium text-stone-500">
            {totalKings} kings - {ROYAL_BURIAL_SITES.length} burial sites
          </p>
          <div className="mt-4 flex max-w-md items-center gap-2 rounded-xl border border-stone-200 bg-[#fefcf7] px-3 py-2">
            <Search className="h-4 w-4 text-stone-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by king name..."
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Burial locations map</p>
          <div className="relative h-[22rem] overflow-hidden rounded-xl border border-stone-200 bg-[#f4efe3]">
            <BookCitiesMapLibreMap
              places={burialMapPlaces}
              panelTone="light"
              className="h-full"
              routeLines={null}
              historicOverlay={null}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Uses the same Book Cities map engine. Click any city to toggle its label; multiple labels can stay open together.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ROYAL_BURIAL_SITES.map((site) => {
            const kings = kingsBySite.get(site.key) ?? [];
            const open = openSites.has(site.key);
            const isMatch = matchingSites.has(site.key);
            return (
              <article
                key={site.key}
                className={`rounded-2xl border border-stone-200 bg-white transition-all ${isMatch ? "opacity-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md" : "opacity-40"}`}
              >
                <button type="button" onClick={() => toggleSite(site.key)} className="w-full px-4 py-4 text-left">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                      {kings.length} king{kings.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900">{site.name}</h2>
                  <p className="mt-0.5 text-xs text-stone-500">{site.location}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SITE_GROUP_STYLE[site.group]}`}>
                      {site.group === "israel" ? "Israel North" : site.group === "unknown" ? "Unknown/Exile" : site.group[0]!.toUpperCase() + site.group.slice(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-600">{site.description}</p>
                </button>

                {open ? (
                  <div className="border-t border-stone-200 px-4 py-3">
                    <ul className="space-y-2">
                      {kings.map((king) => {
                        const rowMatch = !q || king.name.toLowerCase().includes(q);
                        return (
                          <li key={`${site.key}-${king.name}`} className={`rounded-lg border border-stone-200 bg-[#fffefb] px-3 py-2 ${rowMatch ? "opacity-100" : "opacity-50"}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-stone-900">{king.name}</p>
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700">
                                {KINGDOM_LABEL[king.kingdom]}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CIRCUMSTANCE_STYLE[king.circumstance]}`}>
                                {CIRCUMSTANCE_LABEL[king.circumstance]}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600">
                              {king.reignApprox ? `${king.reignApprox} - ` : ""}
                              {king.reference}
                            </p>
                            <p className="mt-0.5 text-xs text-stone-500">{king.notes}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
