import { burauDet, reduceBraid, writhe } from "./braid.ts";
import { jonesPoly } from "./kauffman.ts";
import { pFormat, pMul, type Poly } from "./poly.ts";

/**
 * Two dies as two braids. They never share RAM. Topology of the pair:
 * the commutator ABA⁻¹B⁻¹ is the area their worldlines enclose.
 * Trivial commutator ⇒ they commute. Non-trivial ⇒ a new knot neither one is.
 * Jones(AB) vs Jones(A)Jones(B) is the split test (connected-sum multiplicativity).
 */

function inv(word: number[]) {
  return [...word].reverse().map((g) => -g);
}

export function composeBraid(a: number[], b: number[]) {
  return reduceBraid([...a, ...b]);
}

export function braidCommutator(a: number[], b: number[]) {
  return reduceBraid([...a, ...b, ...inv(a), ...inv(b)]);
}

/** Blackboard framing: the 2-cable of a closed braid links by its writhe. */
export function blackboardLink(word: number[]) {
  return writhe(word);
}

export function worldlineLink(a: number[], b: number[]) {
  const c = braidCommutator(a, b);
  return {
    word: c,
    crossings: c.length,
    writhe: writhe(c),
    det: burauDet(c),
    trivial: c.length === 0,
  };
}

export function jonesOf(word: number[]) {
  return jonesPoly(word);
}

export function splitJones(a: number[], b: number[]) {
  const ja = jonesPoly(a).jones;
  const jb = jonesPoly(b).jones;
  const jab = jonesPoly(composeBraid(a, b)).jones;
  const prod = pMul(ja, jb);
  return {
    product: pFormat(prod, "t"),
    composed: pFormat(jab, "t"),
    split: samePoly(prod, jab),
  };
}

function samePoly(a: Poly, b: Poly) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a[Number(k)] ?? 0) !== (b[Number(k)] ?? 0)) return false;
  return true;
}

/** |Δ(AB)(-1)| / (|ΔA||ΔB|). 1-ish when composition is split-like; grows when they knot. */
export function knottingRatio(a: number[], b: number[]) {
  const da = burauDet(a) || 1;
  const db = burauDet(b) || 1;
  const dab = burauDet(composeBraid(a, b)) || 1;
  return dab / (da * db);
}

export function pairInvariants(a: number[], b: number[]) {
  const link = worldlineLink(a, b);
  const split = splitJones(a, b);
  return {
    commutator: link,
    split: split.split,
    jonesProduct: split.product,
    jonesComposed: split.composed,
    knotting: Number(knottingRatio(a, b).toFixed(4)),
    blackboard: { a: blackboardLink(a), b: blackboardLink(b) },
  };
}
