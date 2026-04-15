import { useState } from "react";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import type { Prayer, TimelineEvent } from "@/types";

export function PrayerForm({
  initial,
  events,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Partial<Prayer> | null;
  events: TimelineEvent[];
  onDelete?: () => void | Promise<void>;
  onSave: (payload: {
    title: string;
    body: string | null;
    status: string;
    prayed_on: string;
    answered_on: string | null;
    answer_notes: string | null;
    linked_event_id: string | null;
    tags: string[] | null;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [status, setStatus] = useState(initial?.status ?? "waiting");
  const [prayedOn, setPrayedOn] = useState(initial?.prayed_on ?? new Date().toISOString().slice(0, 10));
  const [answeredOn, setAnsweredOn] = useState(initial?.answered_on ?? "");
  const [answerNotes, setAnswerNotes] = useState(initial?.answer_notes ?? "");
  const [linked, setLinked] = useState(initial?.linked_event_id ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          body: body || null,
          status,
          prayed_on: prayedOn,
          answered_on: answeredOn || null,
          answer_notes: answerNotes || null,
          linked_event_id: linked || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });
      }}
    >
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="apple-field"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Details…"
        rows={3}
        className="apple-field"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="apple-field mt-1.5">
            <option value="waiting">Waiting</option>
            <option value="ongoing">Ongoing</option>
            <option value="answered">Answered</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground">Prayed on</label>
          <input
            type="date"
            value={prayedOn}
            onChange={(e) => setPrayedOn(e.target.value)}
            className="apple-field mt-1.5"
          />
        </div>
      </div>
      {status === "answered" ? (
        <>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Answered on</label>
            <input
              type="date"
              value={answeredOn}
              onChange={(e) => setAnsweredOn(e.target.value)}
              className="apple-field mt-1.5"
            />
          </div>
          <textarea
            value={answerNotes}
            onChange={(e) => setAnswerNotes(e.target.value)}
            placeholder="How God answered…"
            rows={2}
            className="apple-field"
          />
        </>
      ) : null}
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma-separated" className="apple-field" />
      <select value={linked} onChange={(e) => setLinked(e.target.value)} className="apple-field">
        <option value="">Timeline link (optional)</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.icon} {ev.title}
          </option>
        ))}
      </select>
      <div className={clsx("flex flex-wrap items-center gap-3 pt-2", onDelete ? "justify-between" : "justify-end")}>
        {onDelete ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!window.confirm("Delete this prayer permanently? This cannot be undone.")) return;
              void onDelete();
            }}
          >
            Delete prayer
          </Button>
        ) : null}
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  );
}
