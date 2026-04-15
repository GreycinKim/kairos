import type { Edge, Node } from "@xyflow/react";
import { ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";

import { api } from "@/api/client";
import { SermonMapFlowCanvasWithProvider } from "@/components/scripture/SermonMapFlowCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractPassagesFromMarkdown, formatPassageLabel, passageNodeId } from "@/lib/parseScriptureHeading";
import { buildEdgesFromMarkdownAndManual, buildPassageNodesFromMarkdown, type PassageNodeData } from "@/lib/scriptureFlowGraph";
import type { FlowMapVerseRollup, ScriptureFlowMap } from "@/types";
import clsx from "clsx";

const LS_NOTES = "kairos_reader_embed_sermon_show_notes";
const LS_MAP = "kairos_reader_embed_sermon_show_map";

function readToggle(key: string, defaultOn: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return defaultOn;
}

function writeToggle(key: string, on: boolean) {
  try {
    window.localStorage.setItem(key, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function ReaderSermonMapPanel({
  mapId,
  mapOptions,
  onMapIdChange,
  contextVerse,
  contextRollup,
  onClose,
  showLeftBorder = true,
}: {
  mapId: string;
  mapOptions: { id: string; title: string }[];
  onMapIdChange: (id: string) => void;
  contextVerse: number;
  contextRollup: FlowMapVerseRollup;
  onClose: () => void;
  /** False when the panel is full-screen (e.g. mobile) so a left divider is not drawn. */
  showLeftBorder?: boolean;
}) {
  const [map, setMap] = useState<ScriptureFlowMap | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [graphNodes, setGraphNodes] = useState<Node<PassageNodeData>[]>([]);
  const [graphEdges, setGraphEdges] = useState<Edge[]>([]);
  const [flowSeed, setFlowSeed] = useState<{ nodes: Node<PassageNodeData>[]; edges: Edge[] } | null>(null);
  const saveEnabledRef = useRef(false);
  const hydratedRef = useRef(false);

  const [showNotes, setShowNotes] = useState(() => readToggle(LS_NOTES, true));
  const [showMap, setShowMap] = useState(() => readToggle(LS_MAP, true));

  const setShowNotesPersist = useCallback((v: boolean | ((b: boolean) => boolean)) => {
    setShowNotes((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      writeToggle(LS_NOTES, next);
      return next;
    });
  }, []);

  const setShowMapPersist = useCallback((v: boolean | ((b: boolean) => boolean)) => {
    setShowMap((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      writeToggle(LS_MAP, next);
      return next;
    });
  }, []);

  const onGraphChange = useCallback((n: Node<PassageNodeData>[], e: Edge[]) => {
    setGraphNodes(n);
    setGraphEdges(e);
  }, []);

  useEffect(() => {
    setFlowSeed(null);
    hydratedRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<ScriptureFlowMap>(`/scripture/flow-maps/${mapId}`);
        if (cancelled) return;
        setMap(data);
        setTitle(data.title);
        const md = data.notes_markdown ?? "";
        setNotes(md);
        const prevN = (data.graph_json?.nodes ?? []) as Node<PassageNodeData>[];
        const prevE = (data.graph_json?.edges ?? []) as Edge[];
        const n = buildPassageNodesFromMarkdown(md, prevN);
        const e = buildEdgesFromMarkdownAndManual(md, prevE);
        setGraphNodes(n);
        setGraphEdges(e);
        setFlowSeed({ nodes: n, edges: e });
        hydratedRef.current = true;
        saveEnabledRef.current = false;
      } catch {
        if (!cancelled) {
          setMap(null);
          setFlowSeed(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapId]);

  useEffect(() => {
    if (!mapId || !hydratedRef.current || !saveEnabledRef.current) return;
    const t = window.setTimeout(() => {
      void api
        .patch<ScriptureFlowMap>(`/scripture/flow-maps/${mapId}`, {
          title: title.trim() || "Untitled map",
          notes_markdown: notes,
          graph_json: { nodes: graphNodes, edges: graphEdges },
        })
        .then(({ data }) => {
          setMap(data);
          saveEnabledRef.current = false;
        })
        .catch(() => {});
    }, 900);
    return () => window.clearTimeout(t);
  }, [mapId, title, notes, graphNodes, graphEdges]);

  const passageStrip = useMemo(() => extractPassagesFromMarkdown(notes), [notes]);

  if (!map || !flowSeed) {
    return (
      <div
        className={clsx(
          "flex min-h-[12rem] flex-1 flex-col bg-neutral-50/90",
          showLeftBorder && "border-l border-neutral-200",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-3 py-2">
          <p className="text-sm font-semibold text-neutral-900">Sermon map</p>
          <button
            type="button"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
            aria-label="Close sermon map panel"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 text-sm text-neutral-500">Loading map…</div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex min-h-0 flex-1 flex-col bg-neutral-50/90",
        showLeftBorder && "border-l border-neutral-200",
      )}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-neutral-200 bg-white/95 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">Sermon map</p>
            <Input
              value={title}
              onChange={(e) => {
                saveEnabledRef.current = true;
                setTitle(e.target.value);
              }}
              className="mt-1 h-8 max-w-full text-xs font-medium"
              placeholder="Map title"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" asChild>
              <Link to={`/scripture/flow?map=${mapId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </Link>
            </Button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
              aria-label="Close sermon map panel"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mapOptions.length > 1 ? (
          <label className="flex flex-col gap-0.5 text-[11px] text-neutral-600">
            <span className="font-medium text-neutral-700">Map for this verse</span>
            <select
              className="apple-field h-9 w-full text-sm"
              value={mapId}
              onChange={(e) => onMapIdChange(e.target.value)}
            >
              {mapOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setShowNotesPersist((n) => !n)}
            className={clsx(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              showNotes ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:text-neutral-900",
            )}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setShowMapPersist((m) => !m)}
            className={clsx(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              showMap ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:text-neutral-900",
            )}
          >
            Map
          </button>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-2 py-1.5 text-[11px] leading-snug text-neutral-800">
          <p className="font-semibold text-neutral-900">Verse {contextVerse}</p>
          {contextRollup.leads_to.length ? (
            <div className="mt-1">
              <p className="font-semibold text-neutral-900">Leads to</p>
              <ul className="mt-0.5 space-y-0.5">
                {contextRollup.leads_to.map((e, i) => (
                  <li key={`ctx-to-${i}`}>
                    <span className="text-neutral-500">{"-> "}</span>
                    {e.ref_label} <span className="text-neutral-400">({e.kind})</span>{" "}
                    <span className="text-neutral-500">{e.map_title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {contextRollup.led_from.length ? (
            <div className="mt-1">
              <p className="font-semibold text-neutral-900">Led from</p>
              <ul className="mt-0.5 space-y-0.5">
                {contextRollup.led_from.map((e, i) => (
                  <li key={`ctx-from-${i}`}>
                    <span className="text-neutral-500">{"<-- "}</span>
                    {e.ref_label} <span className="text-neutral-400">({e.kind})</span>{" "}
                    <span className="text-neutral-500">{e.map_title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Passage trail</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {passageStrip.length === 0 ? (
              <span className="text-[11px] text-neutral-500">Add headings in notes</span>
            ) : (
              passageStrip.map((p, i) => (
                <span key={`${passageNodeId(p)}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? <span className="text-neutral-400">→</span> : null}
                  <span className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-800">
                    {formatPassageLabel(p)}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
        {!showNotes && !showMap ? (
          <p className="px-2 py-6 text-center text-xs text-neutral-500">Turn on Notes or Map to edit this sermon map.</p>
        ) : null}
        {showNotes ? (
          <div className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <MDEditor
              value={notes}
              onChange={(v) => {
                saveEnabledRef.current = true;
                setNotes(v ?? "");
              }}
              height={showMap ? 220 : 360}
              visibleDragbar={false}
              preview="edit"
            />
          </div>
        ) : null}
        {showMap ? (
          <div className="flex min-h-[260px] min-h-0 flex-1 flex-col overflow-hidden">
            <SermonMapFlowCanvasWithProvider
              key={`${mapId}-map`}
              notes={notes}
              setNotes={setNotes}
              initialNodes={graphNodes.length ? graphNodes : flowSeed.nodes}
              initialEdges={graphEdges.length ? graphEdges : flowSeed.edges}
              onGraphChange={onGraphChange}
              saveEnabledRef={saveEnabledRef}
            />
          </div>
        ) : null}
      </div>

      <p className="shrink-0 border-t border-neutral-200 bg-white/90 px-3 py-1 text-[10px] text-neutral-500">
        Saves automatically after you pause editing.
      </p>
    </div>
  );
}
