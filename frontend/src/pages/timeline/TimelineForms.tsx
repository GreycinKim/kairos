import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { ALL_BIBLE_BOOKS } from "@/lib/bibleCanon";
import type {
  FamilyLink,
  FamilyLinkRelation,
  LoreCallout,
  LoreCard,
  PersonFigureKind,
  PersonProfile,
  ScriptureAppearance,
} from "@/lib/timelinePeople";
import { clampAtlasCoord } from "@/lib/mapAtlasOverlays";
import { normalizeScriptureAppearances, PERSON_FIGURE_KIND_LABELS, PERSON_FIGURE_KINDS } from "@/lib/timelinePeople";
import type { TimelineEvent, TimelineEventType } from "@/types";

export const EVENT_TYPES: TimelineEventType[] = [
  "bible_book",
  "empire",
  "ruler",
  "person",
  "journal",
  "milestone",
];

export function ScriptureAppearanceRowForm({ onAdd }: { onAdd: (row: ScriptureAppearance) => void }) {
  const [book, setBook] = useState(ALL_BIBLE_BOOKS[0] ?? "Genesis");
  const [chapter, setChapter] = useState("1");
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <select value={book} onChange={(e) => setBook(e.target.value)} className="apple-field h-9 text-xs">
        {ALL_BIBLE_BOOKS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
      <Input value={chapter} onChange={(e) => setChapter(e.target.value)} className="h-9 w-20 text-xs" inputMode="numeric" />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          const ch = Math.max(1, parseInt(chapter, 10) || 1);
          onAdd({ book, chapter: ch });
        }}
      >
        Add passage
      </Button>
    </div>
  );
}

export function LoreCardRowForm({ onAdd }: { onAdd: (c: LoreCard) => void }) {
  const [kind, setKind] = useState<LoreCard["kind"]>("event");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="mt-2 space-y-2 rounded border border-dashed border-border p-2">
      <div className="flex flex-wrap gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as LoreCard["kind"])} className="apple-field h-9 text-xs">
          <option value="item">Item</option>
          <option value="clothing">Clothing</option>
          <option value="place">Place</option>
          <option value="event">Event</option>
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9 flex-1 text-xs" />
      </div>
      <textarea className="apple-field min-h-[60px] text-xs" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Description…" />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!title.trim()}
        onClick={() => {
          onAdd({ kind, title: title.trim(), body: body.trim() || " " });
          setTitle("");
          setBody("");
        }}
      >
        Add lore card
      </Button>
    </div>
  );
}

export function LoreCalloutRowForm({ onAdd }: { onAdd: (c: LoreCallout) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="mt-2 space-y-2 rounded border border-dashed border-border p-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Callout title" className="h-9 text-xs" />
      <textarea className="apple-field min-h-[50px] text-xs" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Short highlight…" />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!title.trim()}
        onClick={() => {
          onAdd({ title: title.trim(), body: body.trim() || " " });
          setTitle("");
          setBody("");
        }}
      >
        Add callout
      </Button>
    </div>
  );
}

export function TimelineEditPersonForm({
  person,
  peopleOptions = [],
  mapCatalogEntries = [],
  onCancel,
  onSave,
}: {
  person: { event: TimelineEvent; profile: PersonProfile };
  /** Other people/rulers for family-link picker (excludes current person). */
  peopleOptions?: { eventId: string; label: string }[];
  /** Workspace atlas plates (id + title) for optional map pin. */
  mapCatalogEntries?: { id: string; title: string }[];
  onCancel: () => void;
  onSave: (eventId: string, patch: Partial<PersonProfile>) => void;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"bible" | "church_history">("bible");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [diedYear, setDiedYear] = useState("");
  const [ruledFrom, setRuledFrom] = useState("");
  const [ruledTo, setRuledTo] = useState("");
  const [hidden, setHidden] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [scriptureAppearances, setScriptureAppearances] = useState<ScriptureAppearance[]>([]);
  const [loreCards, setLoreCards] = useState<LoreCard[]>([]);
  const [loreCallouts, setLoreCallouts] = useState<LoreCallout[]>([]);
  const [figureKind, setFigureKind] = useState<PersonFigureKind>("other");
  const [familyLinks, setFamilyLinks] = useState<FamilyLink[]>([]);
  const [familyRelation, setFamilyRelation] = useState<FamilyLinkRelation>("parent");
  const [familyPickId, setFamilyPickId] = useState("");
  const [atlasCatalogId, setAtlasCatalogId] = useState("");
  const [atlasNx, setAtlasNx] = useState("0.5");
  const [atlasNy, setAtlasNy] = useState("0.5");

  useEffect(() => {
    setName(person.profile.name || person.event.title);
    setScope(person.profile.scope ?? "bible");
    setTitle(person.profile.title ?? "");
    setBio(person.profile.biography ?? "");
    setDiedYear(person.profile.diedYear != null ? String(person.profile.diedYear) : "");
    setRuledFrom(person.profile.ruledFromYear != null ? String(person.profile.ruledFromYear) : "");
    setRuledTo(person.profile.ruledToYear != null ? String(person.profile.ruledToYear) : "");
    setHidden(Boolean(person.profile.hidden));
    setImageDataUrl(person.profile.imageDataUrl ?? null);
    setScriptureAppearances(normalizeScriptureAppearances(person.profile.scriptureAppearances ?? []));
    setLoreCards([...(person.profile.loreCards ?? [])]);
    setLoreCallouts([...(person.profile.loreCallouts ?? [])]);
    setFigureKind(person.profile.figureKind ?? "other");
    setFamilyLinks([...(person.profile.familyLinks ?? [])]);
    const pin = person.profile.atlasPin;
    if (pin) {
      setAtlasCatalogId(pin.catalogMapId);
      setAtlasNx(String(pin.nx));
      setAtlasNy(String(pin.ny));
    } else {
      setAtlasCatalogId("");
      setAtlasNx("0.5");
      setAtlasNy("0.5");
    }
  }, [person]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(person.event.id, {
          name,
          scope,
          figureKind,
          title: title || undefined,
          biography: bio || undefined,
          diedYear: diedYear ? parseInt(diedYear, 10) : null,
          ruledFromYear: ruledFrom ? parseInt(ruledFrom, 10) : null,
          ruledToYear: ruledTo ? parseInt(ruledTo, 10) : null,
          hidden,
          imageDataUrl,
          scriptureAppearances: scriptureAppearances.length ? scriptureAppearances : undefined,
          loreCards: loreCards.length ? loreCards : undefined,
          loreCallouts: loreCallouts.length ? loreCallouts : undefined,
          familyLinks: familyLinks.length ? familyLinks : undefined,
          atlasPin:
            atlasCatalogId.trim() && mapCatalogEntries.some((e) => e.id === atlasCatalogId)
              ? {
                  catalogMapId: atlasCatalogId.trim(),
                  nx: clampAtlasCoord(parseFloat(atlasNx) || 0),
                  ny: clampAtlasCoord(parseFloat(atlasNy) || 0),
                }
              : undefined,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as "bible" | "church_history")} className="apple-field">
            <option value="bible">Genesis to Revelation</option>
            <option value="church_history">Church history</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Figure category</label>
        <p className="mb-1.5 text-[11px] text-muted-foreground">Sort order on the People tab: King → Prophet → Priest → Disciple → Apostle → Angel → Region.</p>
        <select value={figureKind} onChange={(e) => setFigureKind(e.target.value as PersonFigureKind)} className="apple-field max-w-md">
          {PERSON_FIGURE_KINDS.map((k) => (
            <option key={k} value={k}>
              {PERSON_FIGURE_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title / role</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Biography / details</label>
        <textarea className="apple-field min-h-[90px]" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Died year</label>
          <Input value={diedYear} onChange={(e) => setDiedYear(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ruled from</label>
          <Input value={ruledFrom} onChange={(e) => setRuledFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ruled to</label>
          <Input value={ruledTo} onChange={(e) => setRuledTo(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Profile picture</label>
        <div className="flex flex-wrap items-center gap-3">
          {imageDataUrl ? (
            <img src={imageDataUrl} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
          ) : null}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fr = new FileReader();
              fr.onload = () => setImageDataUrl(typeof fr.result === "string" ? fr.result : null);
              fr.readAsDataURL(file);
            }}
          />
          {imageDataUrl ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setImageDataUrl(null)}>
              Remove photo
            </Button>
          ) : null}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" checked={!hidden} onChange={(e) => setHidden(!e.target.checked)} />
        Show on timeline
      </label>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scripture footprint</p>
        <p className="mb-2 text-[11px] text-muted-foreground">Used for People filters and the reader “Cast in this chapter” list.</p>
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
            Optional portrait on a workspace plate (reader sidebar / atlas). Position is 0–1 from left and top of the map image.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Plate</label>
              <select value={atlasCatalogId} onChange={(e) => setAtlasCatalogId(e.target.value)} className="apple-field h-9 w-full max-w-lg text-xs">
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lore cards</p>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {loreCards.map((c, i) => (
            <div key={`lc-${i}`} className="rounded border border-border bg-muted/20 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">{c.kind}</span>
                <button type="button" className="text-destructive" onClick={() => setLoreCards((a) => a.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
              <p className="mt-1 font-semibold text-foreground">{c.title}</p>
              <p className="mt-0.5 text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
        <LoreCardRowForm onAdd={(c) => setLoreCards((a) => [...a, c])} />
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Family links</p>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Used for the <span className="font-medium">Family tree</span> on the lore page (parents above you, children below, spouses beside).
        </p>
        <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-border p-2">
          {familyLinks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No links yet.</p>
          ) : (
            familyLinks.map((l, i) => (
              <div key={`${l.personEventId}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate">
                  <span className="font-medium capitalize">{l.relation}</span>
                  {" → "}
                  {peopleOptions.find((o) => o.eventId === l.personEventId)?.label ?? l.personEventId}
                </span>
                <button type="button" className="text-destructive" onClick={() => setFamilyLinks((a) => a.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Relation</label>
            <select
              value={familyRelation}
              onChange={(e) => setFamilyRelation(e.target.value as FamilyLinkRelation)}
              className="apple-field h-9 text-xs"
            >
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="min-w-[12rem] flex-1">
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Person</label>
            <select
              value={familyPickId}
              onChange={(e) => setFamilyPickId(e.target.value)}
              className="apple-field h-9 w-full max-w-md text-xs"
            >
              <option value="">Choose…</option>
              {peopleOptions.map((o) => (
                <option key={o.eventId} value={o.eventId}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9"
            disabled={!familyPickId}
            onClick={() => {
              if (!familyPickId) return;
              if (familyLinks.some((l) => l.personEventId === familyPickId && l.relation === familyRelation)) return;
              setFamilyLinks((a) => [...a, { relation: familyRelation, personEventId: familyPickId }]);
              setFamilyPickId("");
            }}
          >
            Add link
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lore callouts</p>
        <div className="max-h-36 space-y-2 overflow-y-auto">
          {loreCallouts.map((c, i) => (
            <div key={`lco-${i}`} className="rounded border border-border bg-muted/20 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{c.title}</span>
                <button type="button" className="text-destructive" onClick={() => setLoreCallouts((a) => a.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
              <p className="mt-1 text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
        <LoreCalloutRowForm onAdd={(c) => setLoreCallouts((a) => [...a, c])} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function TimelineAddPersonForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (event: TimelineEvent, profile: Partial<PersonProfile>) => void;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"bible" | "church_history">("bible");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [diedYear, setDiedYear] = useState("");
  const [ruledFrom, setRuledFrom] = useState("");
  const [ruledTo, setRuledTo] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title: name,
        type: "person" as const,
        start_year: startYear ? parseInt(startYear, 10) : null,
        end_year: endYear ? parseInt(endYear, 10) : null,
        start_date: null,
        end_date: null,
        description: bio || null,
        color: "#5d7f9a",
        icon: "👤",
        era: scope === "bible" ? "Bible timeline" : "Church history",
        author: title || null,
        written_start_year: null,
        written_end_year: null,
      };
      const { data } = await api.post<TimelineEvent>("/timeline/events", payload);
      onCreated(data, {
        eventId: data.id,
        name,
        scope,
        title: title || undefined,
        biography: bio || undefined,
        diedYear: diedYear ? parseInt(diedYear, 10) : null,
        ruledFromYear: ruledFrom ? parseInt(ruledFrom, 10) : null,
        ruledToYear: ruledTo ? parseInt(ruledTo, 10) : null,
        imageDataUrl,
        hidden: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as "bible" | "church_history")} className="apple-field">
            <option value="bible">Genesis to Revelation</option>
            <option value="church_history">Church history</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title / role</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. King of Judah" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start year</label>
          <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="-1000 or 1540" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">End year</label>
          <Input value={endYear} onChange={(e) => setEndYear(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Died year</label>
          <Input value={diedYear} onChange={(e) => setDiedYear(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ruled from</label>
          <Input value={ruledFrom} onChange={(e) => setRuledFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ruled to</label>
          <Input value={ruledTo} onChange={(e) => setRuledTo(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Biography / details</label>
        <textarea className="apple-field min-h-[90px]" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Profile picture</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fr = new FileReader();
            fr.onload = () => setImageDataUrl(typeof fr.result === "string" ? fr.result : null);
            fr.readAsDataURL(file);
          }}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : "Create person"}
        </Button>
      </div>
    </form>
  );
}

export function TimelineAddEventForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TimelineEventType>("milestone");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [color, setColor] = useState("#6b8f71");
  const [icon, setIcon] = useState("📌");
  const [era, setEra] = useState("");
  const [author, setAuthor] = useState("");
  const [writtenStart, setWrittenStart] = useState("");
  const [writtenEnd, setWrittenEnd] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/timeline/events", {
        title,
        type,
        start_year: startYear ? parseInt(startYear, 10) : null,
        end_year: endYear ? parseInt(endYear, 10) : null,
        start_date: null,
        end_date: null,
        description: null,
        color,
        icon,
        era: era || null,
        author: author || null,
        written_start_year: writtenStart ? parseInt(writtenStart, 10) : null,
        written_end_year: writtenEnd ? parseInt(writtenEnd, 10) : null,
      });
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as TimelineEventType)} className="apple-field">
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Start year (BC = negative)</label>
          <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="-586 or 2024" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">End year</label>
          <Input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="optional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Era (optional)</label>
          <Input value={era} onChange={(e) => setEra(e.target.value)} placeholder="e.g. Early Church" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Author (optional)</label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Written start year (optional)</label>
          <Input value={writtenStart} onChange={(e) => setWrittenStart(e.target.value)} placeholder="BC negative" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Written end year</label>
          <Input value={writtenEnd} onChange={(e) => setWrittenEnd(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Color (hex)</label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon (emoji)</label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
