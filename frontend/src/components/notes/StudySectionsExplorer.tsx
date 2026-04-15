import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { STUDY_SECTIONS } from "@/lib/studySections";
import type { StudySection, StudyTopic } from "@/lib/studySections";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export function StudySectionsExplorer() {
  const [sectionId, setSectionId] = useState(STUDY_SECTIONS[0]?.id ?? "");
  const [topic, setTopic] = useState<StudyTopic | null>(null);

  const section = useMemo<StudySection | null>(() => STUDY_SECTIONS.find((s) => s.id === sectionId) ?? null, [sectionId]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-black/[0.06] bg-card p-3">
        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">10 Sections of Study</p>
        <div className="space-y-1">
          {STUDY_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className={clsx(
                "w-full rounded-xl px-3 py-2 text-left transition-colors",
                s.id === sectionId ? "bg-primary/10 text-foreground" : "hover:bg-muted/60 text-muted-foreground",
              )}
            >
              <p className="text-xs font-semibold">
                {i + 1}. {s.title}
              </p>
              <p className="text-[11px] opacity-80">{s.span}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-black/[0.06] bg-card p-5">
        {section ? (
          <>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{section.span}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {section.topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="rounded-xl border border-black/[0.06] bg-muted/20 p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{t.summary}</p>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {topic ? (
        <Modal open={!!topic} onClose={() => setTopic(null)} title={topic.title} wide>
          <div className="space-y-5">
            <img src={topic.imageUrl} alt={topic.title} className="max-h-[20rem] w-full rounded-xl border border-black/[0.08] object-cover" />
            <p className="text-sm text-muted-foreground">{topic.summary}</p>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Chart Highlights</p>
              <ul className="space-y-1 text-sm text-foreground">
                {topic.chartPoints.map((point) => (
                  <li key={point}>- {point}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connected Scripture</p>
              <div className="flex flex-wrap gap-2">
                {topic.scriptures.map((s) => (
                  <Button key={s.label} asChild size="sm" variant="secondary">
                    <Link to={`/?tab=index&book=${encodeURIComponent(s.book)}&chapter=${s.chapter}`}>{s.label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            {topic.id === "gospels-kingdom" ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deep Study</p>
                <Button asChild size="sm">
                  <Link to="/notes/gospels-guide">Open "The Four Gospels — A Complete Study Guide"</Link>
                </Button>
              </div>
            ) : null}

            {topic.id === "exodus-law" ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deep Study</p>
                <Button asChild size="sm">
                  <Link to="/notes/feasts-offerings-guide">Open "The Feasts & Offerings of the Lord"</Link>
                </Button>
              </div>
            ) : null}

            {topic.id === "conquest-kings-exile-return" ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deep Study</p>
                <Button asChild size="sm">
                  <Link to="/notes/royal-burials">Open "Royal Burials of Ancient Israel"</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
