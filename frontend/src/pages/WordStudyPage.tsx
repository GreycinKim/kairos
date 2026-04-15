import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Modal } from "@/components/shared/Modal";
import { WordStudyForm } from "@/components/wordStudy/WordStudyForm";
import { WordStudyList } from "@/components/wordStudy/WordStudyList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { WordStudy } from "@/types";

export function WordStudyPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<WordStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WordStudy | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WordStudy | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<WordStudy[]>("/word-studies");
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const sid = searchParams.get("study");
    if (!sid || !items.length) return;
    const w = items.find((x) => x.id === sid);
    if (w) setSelected(w);
  }, [searchParams, items]);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["word", "transliteration", "strongs_number", "definition", "verse_references"],
        threshold: 0.28,
        ignoreLocation: true,
      }),
    [items],
  );

  const visible = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    return fuse.search(q).map((r) => r.item);
  }, [items, fuse, search]);

  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Word studies</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Greek and Hebrew lexicon cards. Search by surface form, transliteration, Strong&apos;s number, or verse
            reference.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          New word study
        </Button>
      </div>

      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        className="mt-8 max-w-md"
      />

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <WordStudyList items={visible} onSelect={(ws) => setSelected(ws)} />
        )}
      </div>

      {selected ? (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected.word} wide>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {selected.transliteration ? <span>Transliteration: {selected.transliteration}</span> : null}
              {selected.strongs_number ? <span className="font-medium text-primary">Strong&apos;s {selected.strongs_number}</span> : null}
              {selected.language ? <span className="capitalize">{selected.language}</span> : null}
            </div>
            {selected.definition ? <p className="text-sm text-foreground">{selected.definition}</p> : null}
            {selected.extended_notes ? <MarkdownRenderer source={selected.extended_notes} /> : null}
            {selected.verse_references?.length ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Verses</p>
                <div className="flex flex-wrap gap-2">
                  {selected.verse_references.map((v) => (
                    <span key={v} className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditTarget(selected);
                setSelected(null);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        </Modal>
      ) : null}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? "Edit word study" : "New word study"} wide>
        <WordStudyForm
          initial={editTarget}
          onSaved={() => {
            setFormOpen(false);
            setEditTarget(null);
            void load();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
