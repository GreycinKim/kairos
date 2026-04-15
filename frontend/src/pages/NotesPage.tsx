import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { NoteCard } from "@/components/notes/NoteCard";
import { StudySectionsExplorer } from "@/components/notes/StudySectionsExplorer";
import { TagBadge } from "@/components/notes/TagBadge";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import type { Note, Tag } from "@/types";

export function NotesPage() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [detail, setDetail] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"notes" | "study">("notes");

  const load = async () => {
    setLoading(true);
    try {
      const [nRes, tRes] = await Promise.all([api.get<Note[]>("/notes"), api.get<Tag[]>("/tags")]);
      setNotes(nRes.data);
      setTags(tRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const nid = searchParams.get("note");
    if (!nid || !notes.length) return;
    const n = notes.find((x) => x.id === nid);
    if (n) setDetail(n);
  }, [searchParams, notes]);

  const filtered = useMemo(() => {
    let list = notes;
    if (tagFilter) {
      list = list.filter((n) => n.tags.some((t) => t.id === tagFilter));
    }
    const q = search.trim();
    if (!q) return list;
    const f = new Fuse(list, {
      keys: ["title", "body"],
      threshold: 0.3,
      ignoreLocation: true,
    });
    return f.search(q).map((r) => r.item);
  }, [notes, search, tagFilter]);

  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">All notes</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Fuzzy search across every study note. Filter by tag. Wiki links like [[Salvation]] resolve from the timeline
        drawer notes.
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-black/[0.08] bg-card p-1">
        <button
          type="button"
          onClick={() => setView("notes")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Notes Library
        </button>
        <button
          type="button"
          onClick={() => setView("study")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === "study" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          10 Sections of Study
        </button>
      </div>

      {view === "study" ? <StudySectionsExplorer /> : null}

      {view === "notes" ? (
        <>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…"
          className="apple-field max-w-md"
        />
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tag filter
          </label>
          <select value={tagFilter ?? ""} onChange={(e) => setTagFilter(e.target.value || null)} className="apple-field min-w-[10rem]">
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTagFilter(tagFilter === t.id ? null : t.id)}
            className="transition-opacity duration-200 ease-out hover:opacity-85"
          >
            <TagBadge name={t.name} color={t.color} />
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <NoteCard key={n.id} note={n} onClick={() => setDetail(n)} />
          ))}
        </div>
      )}

      {detail ? (
        <Modal open={!!detail} onClose={() => setDetail(null)} title={detail.title || "Note"} wide>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/timeline/event/${detail.event_id}`}>Edit on timeline</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!window.confirm("Delete this note permanently?")) return;
                void (async () => {
                  try {
                    const id = detail.id;
                    await api.delete(`/notes/${id}`);
                    setNotes((prev) => prev.filter((n) => n.id !== id));
                    setDetail(null);
                  } catch {
                    /* ignore */
                  }
                })();
              }}
            >
              Delete note
            </Button>
          </div>
          <MarkdownRenderer source={detail.body ?? ""} />
        </Modal>
      ) : null}
        </>
      ) : null}
    </div>
  );
}
