import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { benchRoutes, pickWinner } from "@/lib/geometry/bench";
import { compareDensity } from "@/lib/geometry/density";
import { knotSeal } from "@/lib/geometry/braid";
import { executeLattice, writeLattice } from "@/lib/geometry/lattice";
import { HxPolyApps } from "@/components/hx/hx-poly-apps";
import { useForgeStore } from "@/lib/forge-store";

type Density = Awaited<ReturnType<typeof compareDensity>>;

export function HxLattice() {
  const files = useForgeStore((s) => s.files);
  const [query, setQuery] = useState("test ledger clamp");
  const [run, setRun] = useState(0);
  const [density, setDensity] = useState<Density | null>(null);
  const points = useMemo(() => writeLattice(files), [files]);
  const rows = useMemo(() => benchRoutes(files, query), [files, query, run]);
  const hits = useMemo(() => executeLattice(files, query, 6).hits, [files, query, run]);
  const winner = pickWinner(rows);
  const seal = useMemo(() => knotSeal(Object.values(files).join("\n").slice(0, 8000)), [files]);

  useEffect(() => {
    void compareDensity(files).then(setDensity);
  }, [files]);

  return (
    <section className="min-h-0 flex-1 overflow-auto p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg">Lattice</h2>
        <Badge tone="pass">LIVE KnotNest</Badge>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted text-pretty">
        A computer is a translator. The weak link is English → bits. This layer translates into
        nested knots and trits (three phases on a circle). That is not superposition and not a
        qutrit on the silicon. It is a geometric alphabet the app can nest. Host disks still
        store the generator as bits.
      </p>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setRun((n) => n + 1);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md bg-inset px-3 text-sm outline-none"
          placeholder="English → point"
        />
        <Button type="submit">Translate</Button>
      </form>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>Unit cube</CardTitle>
          <svg viewBox="0 0 260 260" className="mt-3 h-64 w-full">
            <rect x="8" y="8" width="244" height="244" fill="var(--color-inset)" />
            {points.slice(0, 80).map((p, i) => (
              <circle
                key={i}
                cx={8 + p.x * 244}
                cy={8 + (1 - p.y) * 244}
                r={3 + p.z * 4}
                fill="var(--color-accent)"
                opacity={0.35 + p.z * 0.5}
              />
            ))}
          </svg>
          <p className="mt-2 text-xs text-subtle">{points.length} points · z is depth</p>
        </Card>
        <Card>
          <CardTitle>KnotNest density</CardTitle>
          {density ? (
            <>
              <p className="mt-2 text-sm">
                Structured: {density.structured.packed} / {density.structured.raw} bytes (
                {(density.structured.ratio * 100).toFixed(0)}%)
              </p>
              <p className="text-sm text-muted">gzip of the same text: {density.gzip} bytes</p>
              <p className="text-sm text-muted">
                Random control: {(density.random.ratio * 100).toFixed(0)}% — knots do not shrink noise
              </p>
              <p className="mt-2 text-sm">
                Artin reduce: {seal.saved} crossings dropped · writhe {seal.writhe} · det {seal.det} · 3-color{" "}
                {seal.color3 ? "yes" : "no"}
              </p>
              <p className="font-mono text-xs text-subtle truncate">Gauss {seal.gauss}</p>
              <p className="mt-2 text-xs text-subtle text-pretty">{density.structured.note}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Packing…</p>
          )}
        </Card>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>Route bench</CardTitle>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-subtle">
                <th className="pb-2">route</th>
                <th className="pb-2">ms</th>
                <th className="pb-2">hits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.route}>
                  <td className="py-1">{r.route}</td>
                  <td className="py-1 font-mono">{r.ms.toFixed(2)}</td>
                  <td className="py-1 font-mono">{r.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm">
            This run: <span className="text-accent">{winner}</span>
          </p>
        </Card>
        <Card>
          <CardTitle>Execute working set</CardTitle>
          {hits.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No nearby points.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {hits.map((h, i) => (
                <li key={i} className="font-mono text-xs text-muted">
                  {h.path} · {h.score.toFixed(3)}
                  <span className="block truncate text-subtle">{h.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <HxPolyApps />
    </section>
  );
}
