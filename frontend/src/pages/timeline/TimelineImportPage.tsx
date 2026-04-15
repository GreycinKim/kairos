import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import peopleImportTemplateRaw from "@/data/people-import.template.json?raw";
import { importPeopleFromPack, parsePeoplePackJson, type PeoplePackJson } from "@/lib/timelineBulkImport";
import { useTimelineStore } from "@/store/timelineStore";

export function TimelineImportPage() {
  const events = useTimelineStore((s) => s.events);
  const fetchEvents = useTimelineStore((s) => s.fetchEvents);

  const [jsonText, setJsonText] = useState("");
  const [skipDup, setSkipDup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: { slug: string; eventId: string; title: string }[]; failed: { slug: string; error: string }[] } | null>(null);

  const titleSet = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) {
      if (e.type === "person" || e.type === "ruler") {
        s.add(e.title.trim().toLowerCase());
      }
    }
    return s;
  }, [events]);

  const loadImportTemplate = () => {
    setJsonText(peopleImportTemplateRaw.trim());
    setParseErr(null);
    setResult(null);
  };

  const runImport = async () => {
    setParseErr(null);
    setResult(null);
    let pack: PeoplePackJson;
    try {
      pack = parsePeoplePackJson(jsonText.trim());
    } catch (e) {
      setParseErr(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }

    setBusy(true);
    try {
      const titles = new Set(titleSet);
      const out = await importPeopleFromPack(pack, titles, { skipDuplicateTitles: skipDup });
      setResult(out);
      await fetchEvents();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border px-4 py-4 sm:px-8">
        <Button type="button" variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/timeline">← Timeline</Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Import people (JSON)</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste a pack with <code className="rounded bg-muted px-1">people[]</code>. Each row can be{" "}
          <strong>canonical</strong> (<code className="rounded bg-muted px-1">slug</code>,{" "}
          <code className="rounded bg-muted px-1">timeline_event</code>, <code className="rounded bg-muted px-1">profile</code>) or{" "}
          <strong>flat</strong> (<code className="rounded bg-muted px-1">eventId</code>, <code className="rounded bg-muted px-1">name</code>,{" "}
          <code className="rounded bg-muted px-1">scope</code> such as OT/NT → bible, optional{" "}
          <code className="rounded bg-muted px-1">familyLinks</code> with <code className="rounded bg-muted px-1">type</code> +{" "}
          <code className="rounded bg-muted px-1">targetEventId</code> slugs resolved after import). Creates one timeline person per row and merges
          profiles into your browser storage.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={loadImportTemplate}>
            Import template
          </Button>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} />
            Skip if a person with the same title already exists
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
          placeholder='{ "source": "...", "people": [ { "slug": "...", "timeline_event": { ... }, "profile": { ... } } ] }'
          spellCheck={false}
        />

        {parseErr ? <p className="text-sm text-destructive">{parseErr}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void runImport()} disabled={busy || !jsonText.trim()}>
            {busy ? "Importing…" : "Import"}
          </Button>
          {result?.created.length ? (
            <Button type="button" variant="outline" asChild>
              <Link to="/people">View people</Link>
            </Button>
          ) : null}
        </div>

        {result ? (
          <div className="space-y-3 text-sm">
            {result.created.length ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-semibold text-foreground">Created ({result.created.length})</p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  {result.created.map((r) => (
                    <li key={r.eventId}>
                      {r.title}{" "}
                      <Link className="text-primary underline-offset-2 hover:underline" to={`/timeline/person/${r.eventId}`}>
                        Open profile
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
                  {result.failed.map((f) => (
                    <li key={f.slug}>
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
