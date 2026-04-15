import "@xyflow/react/dist/style.css";

import {
  addEdge,
  Background,
  Controls,
  type Connection,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PassageFlowNode } from "@/components/scripture/PassageFlowNode";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BIBLE_BOOK_TITLES } from "@/lib/bibleBookTitles";
import { markdownHasPassage, parseScriptureHeadingLine, type ParsedPassageRef } from "@/lib/parseScriptureHeading";
import {
  appendPassageHeading,
  buildEdgesFromMarkdownAndManual,
  buildPassageNodesFromMarkdown,
  type PassageNodeData,
} from "@/lib/scriptureFlowGraph";

const nodeTypes = { passage: PassageFlowNode };

function FlowCanvas({
  notes,
  setNotes,
  initialNodes,
  initialEdges,
  onGraphChange,
  saveEnabledRef,
}: {
  notes: string;
  setNotes: (v: string | ((s: string) => string)) => void;
  initialNodes: Node<PassageNodeData>[];
  initialEdges: Edge[];
  onGraphChange: (nodes: Node<PassageNodeData>[], edges: Edge[]) => void;
  saveEnabledRef: React.MutableRefObject<boolean>;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PassageNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    setNodes((prev) => buildPassageNodesFromMarkdown(notes, prev));
    setEdges((prev) => buildEdgesFromMarkdownAndManual(notes, prev));
  }, [notes, setNodes, setEdges]);

  useEffect(() => {
    onGraphChange(nodes, edges);
  }, [nodes, edges, onGraphChange]);

  const onNodesChangeWrapped = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      if (changes.some((c) => c.type !== "select")) saveEnabledRef.current = true;
      onNodesChange(changes);
    },
    [onNodesChange, saveEnabledRef],
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      if (changes.length) saveEnabledRef.current = true;
      onEdgesChange(changes);
    },
    [onEdgesChange, saveEnabledRef],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      saveEnabledRef.current = true;
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22 },
            data: { kind: "manual" as const },
          },
          eds,
        ),
      );
      const targetNode = nodesRef.current.find((n) => n.id === c.target);
      const data = targetNode?.data;
      if (!data) return;
      const ref: ParsedPassageRef = {
        book: data.book,
        chapter: data.chapter,
        verseStart: data.verseStart,
        verseEnd: data.verseEnd,
        rawHeading: data.label,
      };
      setNotes((md) => {
        if (markdownHasPassage(md, ref)) return md;
        saveEnabledRef.current = true;
        return appendPassageHeading(md, ref);
      });
    },
    [setEdges, setNotes, saveEnabledRef],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [addBook, setAddBook] = useState("John");
  const [addChapter, setAddChapter] = useState("3");
  const [addVs, setAddVs] = useState("16");
  const [addVe, setAddVe] = useState("");

  return (
    <>
      <div className="h-[min(100%,calc(100dvh-14rem))] min-h-[280px] w-full rounded-xl border border-black/[0.06] bg-muted/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWrapped}
          onEdgesChange={onEdgesChangeWrapped}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap zoomable pannable className="!rounded-lg !border !border-black/[0.08]" />
          <Panel position="top-right" className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" className="shadow-sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
              Add passage
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add passage to map">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const chapter = parseInt(addChapter, 10);
            const vs = parseInt(addVs, 10);
            const ve = addVe.trim() ? parseInt(addVe, 10) : null;
            if (Number.isNaN(chapter) || Number.isNaN(vs)) return;
            const line = `${addBook.trim()} ${chapter}:${vs}${ve !== null && !Number.isNaN(ve) ? `-${ve}` : ""}`;
            const parsed = parseScriptureHeadingLine(line);
            if (!parsed) return;
            saveEnabledRef.current = true;
            setNotes((md) => appendPassageHeading(md, parsed));
            setAddOpen(false);
          }}
        >
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Book</label>
            <select value={addBook} onChange={(e) => setAddBook(e.target.value)} className="apple-field mt-1.5 w-full">
              {BIBLE_BOOK_TITLES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Chapter</label>
              <Input value={addChapter} onChange={(e) => setAddChapter(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Verse</label>
              <Input value={addVs} onChange={(e) => setAddVs(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">End (opt.)</label>
              <Input value={addVe} onChange={(e) => setAddVe(e.target.value)} className="mt-1.5" placeholder="—" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add to notes &amp; graph
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function SermonMapFlowCanvasWithProvider(props: {
  notes: string;
  setNotes: (v: string | ((s: string) => string)) => void;
  initialNodes: Node<PassageNodeData>[];
  initialEdges: Edge[];
  onGraphChange: (nodes: Node<PassageNodeData>[], edges: Edge[]) => void;
  saveEnabledRef: React.MutableRefObject<boolean>;
}) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
