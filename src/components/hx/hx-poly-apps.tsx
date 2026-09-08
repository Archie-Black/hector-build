import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { loadPolyApps, removePolyApp, runPolyApps, savePolyApp } from "@/lib/geometry/poly-apps";
import { useForgeStore } from "@/lib/forge-store";

export function HxPolyApps() {
  const files = useForgeStore((s) => s.files);
  const [apps, setApps] = useState(loadPolyApps);
  const [name, setName] = useState("My skein");
  const [a, setA] = useState("1");
  const [b, setB] = useState("1");
  const [loop, setLoop] = useState("-2");
  const sample = useMemo(() => Object.values(files).join("\n").slice(0, 4000), [files]);
  const result = useMemo(() => runPolyApps(sample, apps), [sample, apps]);

  return (
    <Card className="mt-3">
      <CardTitle>Polynomial apps</CardTitle>
      <p className="mt-2 text-xs text-muted text-pretty">
        Spectral HX only. Jones and Alexander run on the reduced braid (prefix capped). Install a
        numeric skein (a, b, loop) if you have one. Khovanov and HOMFLY are not here — too much
        surface for how often they would be opened.
      </p>
      <p className="mt-3 font-mono text-sm">Jones V(t) ≈ {result.jones.text}</p>
      {result.jones.truncated ? <p className="text-xs text-subtle">LIVE Jones on 12-crossing prefix.</p> : null}
      <p className="mt-1 font-mono text-sm">Alexander Δ(t) ≈ {result.alexander.text}</p>
      <ul className="mt-3 space-y-1">
        {result.customs.map((c) => (
          <li key={c.id} className="flex h-9 items-center justify-between gap-2 text-sm">
            <span>
              {c.name}: <span className="font-mono">{c.value.toPrecision(6)}</span>
            </span>
            {apps.find((p) => p.id === c.id && !p.builtin) ? (
              <button
                type="button"
                className="text-xs text-muted"
                onClick={() => {
                  removePolyApp(c.id);
                  setApps(loadPolyApps());
                }}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 grid gap-2 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          savePolyApp({
            name: name.trim() || "skein",
            a: Number(a) || 0,
            b: Number(b) || 0,
            loop: Number(loop) || 0,
          });
          setApps(loadPolyApps());
        }}
      >
        <input className="h-11 rounded-md bg-inset px-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="h-11 rounded-md bg-inset px-2 text-sm" value={a} onChange={(e) => setA(e.target.value)} aria-label="a" />
        <input className="h-11 rounded-md bg-inset px-2 text-sm" value={b} onChange={(e) => setB(e.target.value)} aria-label="b" />
        <input className="h-11 rounded-md bg-inset px-2 text-sm" value={loop} onChange={(e) => setLoop(e.target.value)} aria-label="loop" />
        <Button type="submit" className="sm:col-span-4">
          Install polynomial
        </Button>
      </form>
    </Card>
  );
}
