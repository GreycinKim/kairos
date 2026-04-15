import type { Edge, Node } from "@xyflow/react";
import { ArrowLeft, Map, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "@/api/client";
import { SermonMapFlowCanvasWithProvider } from "@/components/scripture/SermonMapFlowCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  extractPassagesFromMarkdown,
  formatPassageLabel,
  passageNodeId,
} from "@/lib/parseScriptureHeading";
import { buildEdgesFromMarkdownAndManual, buildPassageNodesFromMarkdown, type PassageNodeData } from "@/lib/scriptureFlowGraph";
import { FlowMapsLibrary } from "@/components/scripture/FlowMapsLibrary";
import type { ScriptureFlowFolder, ScriptureFlowMap } from "@/types";
import MDEditor from "@uiw/react-md-editor";

export function ScriptureFlowStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mapId = searchParams.get("map");

  const [list, setList] = useState<ScriptureFlowMap[]>([]);
  const [folders, setFolders] = useState<ScriptureFlowFolder[]>([]);
  const [map, setMap] = useState<ScriptureFlowMap | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [graphNodes, setGraphNodes] = useState<Node<PassageNodeData>[]>([]);
  const [graphEdges, setGraphEdges] = useState<Edge[]>([]);
  const [flowSeed, setFlowSeed] = useState<{ nodes: Node<PassageNodeData>[]; edges: Edge[] } | null>(null);
  const saveEnabledRef = useRef(false);
  const hydratedRef = useRef(false);

  const loadList = useCallback(async () => {
    const [mRes, fRes] = await Promise.all([
      api.get<ScriptureFlowMap[]>("/scripture/flow-maps"),
      api.get<ScriptureFlowFolder[]>("/scripture/flow-folders"),
    ]);
    setList(mRes.data.map((m) => ({ ...m, folder_id: m.folder_id ?? null })));
    setFolders(fRes.data);
  }, []);

  useEffect(() => {
    if (!mapId) void loadList();
  }, [mapId, loadList]);

  const onGraphChange = useCallback((n: Node<PassageNodeData>[], e: Edge[]) => {
    setGraphNodes(n);
    setGraphEdges(e);
  }, []);

  useEffect(() => {
    if (!mapId) {
      setMap(null);
      setFlowSeed(null);
      hydratedRef.current = false;
      return;
    }
    let cancelled = false;
    setFlowSeed(null);
    hydratedRef.current = false;
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

  const createMap = async () => {
    const { data } = await api.post<ScriptureFlowMap>("/scripture/flow-maps", { title: "Untitled map", folder_id: null });
    await loadList();
    setSearchParams({ map: data.id });
  };

  if (!mapId) {
    return (
      <div className="px-6 py-8 sm:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Reader
            </Link>
          </Button>
          <Button type="button" onClick={() => void createMap()}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            New sermon map
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link to="/scripture/maps" className="gap-2">
              <Map className="h-4 w-4" strokeWidth={2} aria-hidden />
              Atlas plates
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sermon passage maps</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Notes on the left (use <code className="rounded bg-muted px-1">## John 3:16</code> style headings for each
          passage). The canvas on the right stays in sync: headings become boxes, consecutive headings form dashed
          arrows, and you can draw solid arrows between passages. Organize maps into folders below — drag the grip to
          move a map between columns.
        </p>
        <div className="mt-8">
          <FlowMapsLibrary
            maps={list}
            folders={folders}
            onRefresh={() => void loadList()}
            onOpenMap={(id) => setSearchParams({ map: id })}
          />
        </div>
      </div>
    );
  }

  if (!map || !flowSeed) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-black/[0.06] bg-card/80 px-4 py-3 backdrop-blur">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to="/scripture/flow" className="gap-2">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            All maps
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => {
            saveEnabledRef.current = true;
            setTitle(e.target.value);
          }}
          className="max-w-xs font-medium"
          placeholder="Map title"
        />
        <span className="text-xs text-muted-foreground">Saved automatically after you pause editing.</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-2 lg:divide-x lg:divide-black/[0.06]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden p-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">Passage trail</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Derived from markdown headings (order = dashed arrows on the canvas).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {passageStrip.length === 0 ? (
                <span className="text-xs text-muted-foreground">Add a heading like ## Romans 8:28</span>
              ) : (
                passageStrip.map((p, i) => (
                  <span key={`${passageNodeId(p)}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 ? (
                      <span className="text-muted-foreground/80" aria-hidden>
                        →
                      </span>
                    ) : null}
                    <span className="rounded-lg border border-black/[0.08] bg-muted/40 px-2 py-1 text-[11px] font-medium text-foreground">
                      {formatPassageLabel(p)}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-background">
            <MDEditor
              value={notes}
              onChange={(v) => {
                saveEnabledRef.current = true;
                setNotes(v ?? "");
              }}
              height={420}
              visibleDragbar={false}
              preview="edit"
            />
          </div>
        </div>

        <div className="min-h-0 min-w-0 overflow-hidden p-4">
          <SermonMapFlowCanvasWithProvider
            key={mapId}
            notes={notes}
            setNotes={setNotes}
            initialNodes={flowSeed.nodes}
            initialEdges={flowSeed.edges}
            onGraphChange={onGraphChange}
            saveEnabledRef={saveEnabledRef}
          />
        </div>
      </div>
    </div>
  );
}
