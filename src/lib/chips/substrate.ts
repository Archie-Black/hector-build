import { pairInvariants } from "../geometry/link.ts";
import type { DieState } from "./die.ts";

/**
 * Dies never share RAM. They leave braids on the card substrate.
 * Coupling is the commutator ABA⁻¹B⁻¹: a new knot neither die is.
 * Jones split test: Jones(AB) = Jones(A)Jones(B) iff they didn't knot.
 */

export type Residue = {
  die: string;
  kind: string;
  ram: Float32Array;
  braid: number[];
  writhe: number;
  jones: string;
  paths: { path: string; amp: number }[];
};

export type Emergent = {
  path: string;
  score: number;
  why: string;
  parents: string[];
  knot?: { commutator: number; split: boolean; knotting: number; jones: string };
};

export function residueOf(die: DieState, paths: { path: string; amp: number }[]): Residue {
  return {
    die: die.spec.id,
    kind: die.spec.kind,
    ram: new Float32Array(die.ram),
    braid: [...die.braid],
    writhe: die.writhe,
    jones: die.jones,
    paths: paths.slice(0, 12),
  };
}

export function couple(residues: Residue[]): Emergent[] {
  if (residues.length < 2) {
    const p = residues[0]?.paths[0];
    return p ? [{ path: p.path, score: p.amp, why: "single die", parents: residues.map((r) => r.die) }] : [];
  }

  const memo = new Map<string, ReturnType<typeof pairInvariants>>();
  const pairOf = (a: Residue, b: Residue) => {
    const k = a.die < b.die ? `${a.die}|${b.die}` : `${b.die}|${a.die}`;
    let inv = memo.get(k);
    if (!inv) {
      inv = pairInvariants(a.braid, b.braid);
      memo.set(k, inv);
    }
    return inv;
  };

  let knotting = 1;
  let split = true;
  let commutator = 0;
  let jones = "1";
  for (let i = 0; i < residues.length; i++) {
    for (let j = i + 1; j < residues.length; j++) {
      const inv = pairOf(residues[i], residues[j]);
      knotting *= inv.knotting;
      split = split && inv.split;
      commutator += inv.commutator.crossings;
      if (!inv.commutator.trivial) jones = inv.jonesComposed;
    }
  }

  const pathScore = new Map<string, { score: number; parents: Set<string> }>();
  for (const r of residues) {
    for (const p of r.paths) {
      const cur = pathScore.get(p.path) ?? { score: 0, parents: new Set<string>() };
      const others = residues.filter((x) => x.die !== r.die);
      const beat = others.reduce((s, o) => {
        const hit = o.paths.find((q) => q.path === p.path);
        const link = pairOf(r, o);
        const w = 1 + link.commutator.crossings + (link.split ? 0 : 2) * link.knotting;
        return s + (hit ? hit.amp * w : p.amp * 0.12 * w);
      }, 0);
      cur.score += p.amp * beat;
      cur.parents.add(r.die);
      pathScore.set(p.path, cur);
    }
  }

  const ranked = [...pathScore.entries()]
    .map(([path, v]) => ({ path, score: v.score, parents: [...v.parents] }))
    .sort((a, b) => b.score - a.score);

  const soloTop = new Set(residues.map((r) => r.paths[0]?.path).filter(Boolean) as string[]);
  const peak = ranked.find((r) => !soloTop.has(r.path) && r.parents.length > 1) ?? ranked[0];
  const rest = ranked.filter((r) => r !== peak).slice(0, 4);
  const knot = {
    commutator,
    split,
    knotting: Number(knotting.toFixed(4)),
    jones,
  };
  const whyKnot = !split || commutator > 0
    ? `commutator knot ${jones} (not a connected sum)`
    : "split Jones — they commute";

  return [peak, ...rest].filter(Boolean).map((e) => ({
    path: e.path,
    score: Number(e.score.toFixed(5)),
    why: soloTop.has(e.path) ? `aligned collapse · ${whyKnot}` : `constructive beat · ${whyKnot}`,
    parents: e.parents,
    knot,
  }));
}
