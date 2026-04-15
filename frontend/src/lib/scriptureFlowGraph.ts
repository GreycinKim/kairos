import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

import type { ParsedPassageRef } from "@/lib/parseScriptureHeading";
import { extractPassagesFromMarkdown, formatPassageLabel, passageNodeId } from "@/lib/parseScriptureHeading";

export type PassageNodeData = {
  label: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
};

function defaultPosition(index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: 40 + col * 220, y: 40 + row * 130 };
}

export function buildPassageNodesFromMarkdown(
  md: string,
  prevNodes: Node<PassageNodeData>[],
): Node<PassageNodeData>[] {
  const refs = extractPassagesFromMarkdown(md);
  const prevById = new Map(prevNodes.map((n) => [n.id, n]));
  return refs.map((r: ParsedPassageRef, i: number) => {
    const id = passageNodeId(r);
    const old = prevById.get(id) as Node<PassageNodeData> | undefined;
    const data: PassageNodeData = {
      label: formatPassageLabel(r),
      book: r.book,
      chapter: r.chapter,
      verseStart: r.verseStart,
      verseEnd: r.verseEnd,
    };
    return {
      id,
      type: "passage" as const,
      position: old?.position ?? defaultPosition(i),
      data,
    };
  });
}

export function buildEdgesFromMarkdownAndManual(
  md: string,
  prevEdges: Edge[],
): Edge[] {
  const refs = extractPassagesFromMarkdown(md);
  const ids = new Set(refs.map((r) => passageNodeId(r)));
  const manual = prevEdges.filter(
    (e) => e.data?.kind === "manual" && ids.has(e.source) && ids.has(e.target),
  );
  const chain: Edge[] = [];
  for (let i = 0; i < refs.length - 1; i++) {
    const s = passageNodeId(refs[i]!);
    const t = passageNodeId(refs[i + 1]!);
    chain.push({
      id: `chain-${s}-${t}`,
      source: s,
      target: t,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22 },
      style: { strokeDasharray: "6 4", opacity: 0.85 },
      data: { kind: "chain" },
    });
  }
  return [...chain, ...manual];
}

export function appendPassageHeading(md: string, r: ParsedPassageRef): string {
  const block = `\n\n## ${formatPassageLabel(r)}\n\n`;
  if (md.trim() === "") return `## ${formatPassageLabel(r)}\n\n`;
  return md.endsWith("\n") ? `${md}${block.trimStart()}` : `${md}${block}`;
}
