import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import placesImportTemplateRaw from "@/data/places-import.template.json?raw";
import { loadPlaces } from "@/lib/places";
import { importPlacesFromPack, parsePlacesPackJson, type PlacesPackJson } from "@/lib/placesBulkImport";

export function PlacesImportPage() {
  const [jsonText, setJsonText] = useState("");
  const [skipDup, setSkipDup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: { slug: string; placeId: string; name: string }[]; failed: { slug: string; error: string }[] } | null>(
    null,
  );

  const loadImportTemplate = () => {
    setJsonText(placesImportTemplateRaw.trim());
    setParseErr(null);
    setResult(null);
  };

  const runImport = () => {
    setParseErr(null);
    setResult(null);
    let pack: PlacesPackJson;
    try {
      pack = parsePlacesPackJson(jsonText.trim());
    } catch (e) {
      setParseErr(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }

    setBusy(true);
    try {
      const names = new Set<string>();
      for (const p of Object.values(loadPlaces())) {
        names.add(p.name.trim().toLowerCase());
      }
      const out = importPlacesFromPack(pack, names, { skipDuplicateNames: skipDup });
      setResult(out);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/places">← Places</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Import places (JSON)</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste a pack with <code className="rounded bg-muted px-1">places[]</code>: each row has <code className="rounded bg-muted px-1">slug</code> (for
          logs) and <code className="rounded bg-muted px-1">place</code> with <code className="rounded bg-muted px-1">name</code>, optional{" "}
          <code className="rounded bg-muted px-1">region</code>, <code className="rounded bg-muted px-1">id</code> (upsert),{" "}
          <code className="rounded bg-muted px-1">description</code>,{" "}
          <code className="rounded bg-muted px-1">imageDataUrl</code>,           <code className="rounded bg-muted px-1">scriptureAppearances</code>, optional{" "}
          <code className="rounded bg-muted px-1">atlasPin</code> (<code className="rounded bg-muted px-1">catalogMapId</code>,{" "}
          <code className="rounded bg-muted px-1">nx</code>, <code className="rounded bg-muted px-1">ny</code> on the workspace plate), and{" "}
          <code className="rounded bg-muted px-1">relatedTimelineEventIds</code> (existing timeline event ids).
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={loadImportTemplate}>
            Import template
          </Button>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} />
            Skip if a place with the same name already exists
          </label>
        </div>

        <textarea
          className="apple-field min-h-[280px] flex-1 font-mono text-xs"
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setParseErr(null);
            setResult(null);
          }}
          placeholder='{ "source": "...", "places": [ { "slug": "...", "place": { "name": "...", "scriptureAppearances": [...] } } ] }'
          spellCheck={false}
        />

        {parseErr ? <p className="text-sm text-destructive">{parseErr}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => runImport()} disabled={busy || !jsonText.trim()}>
            {busy ? "Importing…" : "Import"}
          </Button>
          {result?.created.length ? (
            <Button type="button" variant="outline" asChild>
              <Link to="/places">View places</Link>
            </Button>
          ) : null}
        </div>

        {result ? (
          <div className="space-y-3 text-sm">
            {result.created.length ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-semibold text-foreground">Imported ({result.created.length})</p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  {result.created.map((r) => (
                    <li key={`${r.slug}-${r.placeId}`}>
                      {r.name}{" "}
                      <Link className="text-primary underline-offset-2 hover:underline" to={`/places/${r.placeId}`}>
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.failed.length ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-semibold text-destructive">Skipped / errors ({result.failed.length})</p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {result.failed.map((f, i) => (
                    <li key={`${f.slug}-${i}`}>
                      <span className="font-mono">{f.slug}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
