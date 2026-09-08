import { braidOfText, reduceBraid, writhe } from "@/lib/geometry/braid";
import { jonesPoly } from "@/lib/geometry/kauffman";
import { pFormat } from "@/lib/geometry/poly";
import { executeLattice } from "@/lib/geometry/lattice";
import { retrieve } from "@/lib/ide/indexer";
import { hyper } from "@/lib/geometry/hyper-memory";

/**
 * Geometry is the twin of the qubit here — gravity makes superposition
 * expensive in matter, cheap in topology. A knot keeps a relation that
 * a bit forgets. Observe is the only collapse. Files are the shadow.
 */

export type Amplitude = { path: string; amp: number; offset: number; text: string };

export type GeoPhase = {
  writhe: number;
  jones: string;
  nest: number;
  bins: number;
  amplitudes: Amplitude[];
};

function knotOf(text: string) {
  const braid = reduceBraid(braidOfText(text));
  return { writhe: writhe(braid), jones: pFormat(jonesPoly(braid), "t") };
}

function softmax(scores: number[]) {
  const m = Math.max(...scores, 0);
  const ex = scores.map((s) => Math.exp(s - m));
  const z = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / z);
}

/** Uncollapsed working set. Many paths at once, like a superposition. */
export function hold(files: Record<string, string>, query: string): GeoPhase {
  hyper.nest();
  const knot = knotOf(query);
  const rust = executeLattice(files, query, 12);
  const js = retrieve(query, 12);
  const rows = rust.hits.length ? rust.hits : js;
  const amps = softmax(rows.map((h) => h.score));
  const phase: GeoPhase = {
    writhe: knot.writhe,
    jones: knot.jones,
    nest: hyper.stats().nested,
    bins: hyper.stats().bins,
    amplitudes: rows.map((h, i) => ({
      path: h.path,
      amp: Number((amps[i] ?? 0).toFixed(4)),
      offset: h.offset,
      text: h.text.slice(0, 200),
    })),
  };
  hyper.unnest();
  return phase;
}

/** Collapse. One working set. The classical shadow the agent may edit. */
export function observe(files: Record<string, string>, query: string, k = 5) {
  const phase = hold(files, query);
  const chosen = [...phase.amplitudes].sort((a, b) => b.amp - a.amp).slice(0, k);
  return {
    phase: { ...phase, amplitudes: chosen },
    paths: [...new Set(chosen.map((a) => a.path))],
    text: chosen
      .map((a) => `### ${a.path} @${a.offset} amp=${a.amp} W=${phase.writhe}\n${a.text}`)
      .join("\n\n"),
  };
}

export function ontologyLine(phase: GeoPhase) {
  return `geo W=${phase.writhe} J=${phase.jones} nest=${phase.nest} bins=${phase.bins}`;
}

export function workingPack(files: Record<string, string>, query: string) {
  const o = observe(files, query, 5);
  return {
    paths: o.paths,
    text: `${ontologyLine(o.phase)}\n${o.text}`.slice(0, 2800),
    geo: ontologyLine(o.phase),
  };
}
