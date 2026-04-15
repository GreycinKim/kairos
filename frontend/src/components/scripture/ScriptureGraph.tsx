/** Simple list view of graph nodes/edges from API (MVP). */
export function ScriptureGraph({
  nodes,
  edges,
}: {
  nodes: { id: string; label: string; kind: string }[];
  edges: { from: string; to: string; source_type?: string }[];
}) {
  if (!nodes.length) return <p className="text-xs text-muted-foreground">No connections yet.</p>;
  return (
    <div className="space-y-3 text-xs text-muted-foreground">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Linked web</p>
      <ul className="space-y-1">
        {edges.slice(0, 24).map((e, i) => (
          <li key={i} className="rounded-lg bg-muted/40 px-2 py-1 font-mono text-[11px] text-foreground/90">
            {e.from} → {e.to}
            {e.source_type ? <span className="ml-2 text-muted-foreground/80">({e.source_type})</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
