import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SearchBar } from "@/components/shared/SearchBar";
import { api } from "@/api/client";
import type { SearchHit } from "@/types";

const ICONS: Record<string, string> = {
  timeline: "⏳",
  note: "✍️",
  journal: "📓",
  word_study: "📖",
  prayer: "🙏",
  theme: "🎨",
};

export function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Record<string, SearchHit[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (q.trim().length < 2) {
        setResults(null);
        return;
      }
      void (async () => {
        setLoading(true);
        try {
          const { data } = await api.get<{ results: Record<string, SearchHit[]> }>("/search", {
            params: { q: q.trim() },
          });
          setResults(data.results);
        } catch {
          setResults(null);
        } finally {
          setLoading(false);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const go = (hit: SearchHit) => {
    navigate(hit.route_hint);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Search</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One query across timeline, notes, journal, word studies, prayers, and themes.
      </p>
      <div className="mt-8">
        <SearchBar value={q} onChange={setQ} placeholder="Search Kairos…" />
      </div>
      {loading ? <p className="mt-8 text-sm text-muted-foreground">Searching…</p> : null}
      {results && !loading ? (
        <div className="mt-10 space-y-8">
          {Object.entries(results).map(([bucket, hits]) =>
            hits.length ? (
              <section key={bucket}>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-primary">{bucket}</h2>
                <ul className="space-y-2">
                  {hits.map((h) => (
                    <li key={`${h.type}-${h.id}`}>
                      <button
                        type="button"
                        onClick={() => go(h)}
                        className="flex w-full items-start gap-3 rounded-xl border border-black/[0.06] bg-card px-4 py-3 text-left shadow-sm transition-all duration-200 ease-out hover:border-primary/20 hover:shadow-float"
                      >
                        <span className="text-lg">{ICONS[h.type] ?? "·"}</span>
                        <span>
                          <span className="font-medium text-foreground">{h.title}</span>
                          {h.snippet ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.snippet}</p> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
