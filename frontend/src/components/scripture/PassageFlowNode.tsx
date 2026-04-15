import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { PassageNodeData } from "@/lib/scriptureFlowGraph";

type PassageNode = Node<PassageNodeData, "passage">;

export function PassageFlowNode({ data, selected }: NodeProps<PassageNode>) {
  return (
    <div
      className={`min-w-[9rem] max-w-[11rem] rounded-xl border bg-card px-3 py-2 text-left shadow-sm transition-shadow ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-black/[0.08]"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-primary/70" />
      <p className="text-[11px] font-semibold leading-tight text-primary">{data.label}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">Passage</p>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-primary/70" />
    </div>
  );
}
