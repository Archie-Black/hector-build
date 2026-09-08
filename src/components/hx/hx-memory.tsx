import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { type RecalledItem } from "@/lib/memory/lattice";
import { graphSnapshot, recallMemory } from "@/lib/memory/warehouse";

type Graph = {
  nodes: { id: string; layer: string; text: string; salience: number }[];
  edges: { from: string; to: string; rel: string }[];
  engine: string;
};

export function HxMemory() {
  const [items, setItems] = useState<RecalledItem[]>([]);
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [], engine: "none" });

  useEffect(() => {
    void recallMemory({ data: "build test patch lesson sql" }).then(setItems);
    void graphSnapshot().then(setGraph);
  }, []);

  const layers = ["constitutional", "semantic", "procedural", "episodic"] as const;
  const placed = graph.nodes.map((n, i) => {
    const angle = (i / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
    return { ...n, x: 180 + Math.cos(angle) * 130, y: 140 + Math.sin(angle) * 100 };
  });
  const byId = Object.fromEntries(placed.map((n) => [n.id, n]));

  return (
    <section className="min-h-0 flex-1 overflow-auto p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg">Lattice memory</h2>
        <Badge tone="pass">v4 embeddings</Badge>
        <Badge tone={graph.engine === "kuzu" ? "pass" : "muted"}>{graph.engine === "kuzu" ? "LIVE Kuzu" : "STUB graph"}</Badge>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted text-pretty">
        Meta-dynamic vectors: 256-d content projection fused with a 32-d metadata vector that
        rewrites on every hit (salience, recency, layer). DuckDB VSS cosine recall. Kuzu stores
        Distills, Similar, Used, Assigned.
      </p>
      <Card className="mb-4">
        <CardTitle>Relationship graph</CardTitle>
        {placed.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Graph fills as jobs land.</p>
        ) : (
          <svg viewBox="0 0 360 280" className="mt-3 h-64 w-full">
            {graph.edges.map((e, i) => {
              const a = byId[e.from];
              const b = byId[e.to];
              if (!a || !b) return null;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-line)" />;
            })}
            {placed.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={8} fill="var(--color-accent)" />
                <text x={n.x + 10} y={n.y + 3} fill="var(--color-muted)" fontSize="9">
                  {n.layer}
                </text>
              </g>
            ))}
          </svg>
        )}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {layers.map((layer) => (
          <Card key={layer}>
            <CardTitle>{layer}</CardTitle>
            <ul className="mt-3 space-y-2">
              {items
                .filter((i) => i.layer === layer)
                .slice(0, 6)
                .map((i, n) => (
                  <li key={n} className="text-sm text-pretty">
                    {i.text}
                    <span className="ml-2 text-xs text-subtle">{i.score.toFixed(2)}</span>
                    {i.hops?.length ? <span className="block text-xs text-subtle">→ {i.hops[0]}</span> : null}
                  </li>
                ))}
              {items.filter((i) => i.layer === layer).length === 0 ? (
                <li className="text-sm text-muted">Empty until a job lands.</li>
              ) : null}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
