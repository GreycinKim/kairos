import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clampAtlasCoord } from "@/lib/mapAtlasOverlays";
import { fetchWorkspaceMapCatalog } from "@/lib/workspaceMapCatalogFetch";
import { ScriptureAppearanceRowForm } from "@/pages/timeline/TimelineForms";
import { loadPlaces, newPlaceId, savePlaces, type PlaceRecord } from "@/lib/places";
import { normalizeScriptureAppearances, type ScriptureAppearance } from "@/lib/timelinePeople";
import { useTimelineStore } from "@/store/timelineStore";

export function PlaceEditPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname === "/places/new";
  const events = useTimelineStore((s) => s.events);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [scriptureAppearances, setScriptureAppearances] = useState<ScriptureAppearance[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [mapCatalogEntries, setMapCatalogEntries] = useState<{ id: string; title: string }[]>([]);
  const [atlasCatalogId, setAtlasCatalogId] = useState("");
  const [atlasNx, setAtlasNx] = useState("0.5");
  const [atlasNy, setAtlasNy] = useState("0.5");

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    let cancelled = false;
    void fetchWorkspaceMapCatalog().then((data) => {
      if (cancelled) return;
      setMapCatalogEntries((data.entries ?? []).map((e) => ({ id: e.id, title: e.title })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isNew || !placeId) return;
    const all = loadPlaces();
    const p = all[placeId];
    if (!p) return;
    setName(p.name);
    setRegion(p.region ?? "");
    setDescription(p.description ?? "");
    setImageDataUrl(p.imageDataUrl ?? null);
    setScriptureAppearances(normalizeScriptureAppearances(p.scriptureAppearances ?? []));
    setRelatedIds([...(p.relatedTimelineEventIds ?? [])]);
    const pin = p.atlasPin;
    if (pin) {
      setAtlasCatalogId(pin.catalogMapId);
      setAtlasNx(String(pin.nx));
      setAtlasNy(String(pin.ny));
    } else {
      setAtlasCatalogId("");
      setAtlasNx("0.5");
      setAtlasNy("0.5");
    }
  }, [placeId, isNew]);

  const toggleRelated = (id: string) => {
    setRelatedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (a.start_year ?? 0) - (b.start_year ?? 0) || a.title.localeCompare(b.title)),
    [events],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const all = loadPlaces();
    const id = isNew ? newPlaceId() : placeId!;
    const atlasPin =
      atlasCatalogId.trim() && mapCatalogEntries.some((e) => e.id === atlasCatalogId)
        ? {
            catalogMapId: atlasCatalogId.trim(),
            nx: clampAtlasCoord(parseFloat(atlasNx) || 0),
            ny: clampAtlasCoord(parseFloat(atlasNy) || 0),
          }
        : undefined;

    const record: PlaceRecord = {
      id,
      name: trimmed,
      region: region.trim() || undefined,
      description: description.trim() || undefined,
      imageDataUrl: imageDataUrl ?? undefined,
      atlasPin,
      scriptureAppearances: scriptureAppearances.length ? scriptureAppearances : undefined,
      relatedTimelineEventIds: relatedIds.length ? relatedIds : undefined,
    };
    savePlaces({ ...all, [id]: record });
    navigate(`/places/${id}`);
  };

  if (!isNew && placeId && !loadPlaces()[placeId]) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Place not found.</p>
        <Link to="/places" className="mt-2 text-primary">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={isNew ? "/places" : `/places/${placeId}`}>← Cancel</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{isNew ? "New place" : "Edit place"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Image, story, scripture chapters, and timeline events that happened here.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <form className="mx-auto max-w-2xl space-y-5 pb-10" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Region / area</label>
            <p className="mb-1.5 text-[11px] text-muted-foreground">Optional label (e.g. Judea, Galilee) — used to filter on the Places list.</p>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Judea" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea className="apple-field min-h-[120px] w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Image</label>
            <div className="flex flex-wrap items-center gap-3">
              {imageDataUrl ? <img src={imageDataUrl} alt="" className="h-24 w-36 rounded-lg border object-cover" /> : null}
              <input
                type="file"
                accept="image/*"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  const fr = new FileReader();
                  fr.onload = () => setImageDataUrl(typeof fr.result === "string" ? fr.result : null);
                  fr.readAsDataURL(file);
                }}
              />
              {imageDataUrl ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setImageDataUrl(null)}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scripture scenes</p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-2">
              {scriptureAppearances.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rows yet.</p>
              ) : (
                scriptureAppearances.map((row, i) => (
                  <div key={`${row.book}-${row.chapter}-${i}`} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">
                      {row.book} {row.chapter}
                    </span>
                    <button type="button" className="text-destructive" onClick={() => setScriptureAppearances((a) => a.filter((_, j) => j !== i))}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <ScriptureAppearanceRowForm
              onAdd={(row) =>
                setScriptureAppearances((a) => {
                  if (a.some((x) => x.book === row.book && x.chapter === row.chapter)) return a;
                  return [...a, row];
                })
              }
            />
          </div>
          {mapCatalogEntries.length ? (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atlas map pin</p>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Optional marker on a workspace plate (reader / atlas). Uses this place&apos;s image when set. Coordinates 0–1 from left and top.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Plate</label>
                  <select value={atlasCatalogId} onChange={(e) => setAtlasCatalogId(e.target.value)} className="apple-field h-9 w-full text-xs">
                    <option value="">None</option>
                    {mapCatalogEntries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">X (0–1)</label>
                  <Input value={atlasNx} onChange={(e) => setAtlasNx(e.target.value)} className="h-9 text-xs" inputMode="decimal" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Y (0–1)</label>
                  <Input value={atlasNy} onChange={(e) => setAtlasNy(e.target.value)} className="h-9 text-xs" inputMode="decimal" />
                </div>
              </div>
            </div>
          ) : null}
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline events</p>
            <p className="mb-2 text-[11px] text-muted-foreground">Toggle events that narratively belong to this place.</p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded border border-border p-2">
              {sortedEvents.map((ev) => (
                <label key={ev.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted/50">
                  <input type="checkbox" checked={relatedIds.includes(ev.id)} onChange={() => toggleRelated(ev.id)} />
                  <span className="min-w-0 flex-1 truncate">
                    {ev.title}{" "}
                    <span className="text-muted-foreground">
                      ({ev.start_year != null ? ev.start_year : "?"}) · {ev.type}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isNew ? "/places" : `/places/${placeId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
