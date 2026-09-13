export type Place = { az: number; el: number; r: number };

/** Aether on the B3 braid. Same TQC as pathways. Classical. Not a qubit. */

import { act, classId, reduce } from "@/lib/v01d/pathways";
import { braidDelay } from "@/lib/horsemen/tqc";

export function strand(at: Place) {
  const n = Math.max(1, Math.min(6, Math.round(at.r + Math.abs(at.az) + Math.abs(at.el))));
  const s1 = at.az >= 0 ? 1 : -1;
  const s2 = at.el >= 0 ? 2 : -2;
  const w: number[] = [];
  for (let i = 0; i < n; i++) w.push(i % 2 ? s2 : s1);
  return reduce(w);
}

export function knot(at: Place) {
  const word = strand(at);
  const a = act(word);
  const id = classId(a.perm, a.writhe);
  const k = Math.abs(a.writhe) / Math.max(1, word.length);
  return {
    word,
    perm: a.perm,
    writhe: a.writhe,
    classId: id,
    delayMs: braidDelay(0, 3, k),
    k,
  };
}

function cancel(w: number[]) {
  const s: number[] = [];
  for (const g of w) {
    if (s.length && s[s.length - 1] === -g) s.pop();
    else s.push(g);
  }
  return s;
}

export function leftover(from: Place, to: Place) {
  const inv = strand(from).map((g) => -g).reverse();
  const s = cancel(inv.concat(strand(to)));
  return s.length ? act(s).writhe : 0;
}

export function step(from: Place, to: Place): Place {
  const w = Math.abs(leftover(from, to));
  const t = 1 / (1 + w);
  return {
    az: from.az + (to.az - from.az) * t,
    el: from.el + (to.el - from.el) * t,
    r: from.r + (to.r - from.r) * t,
  };
}

export function echoMs(i: number, at: Place) {
  return braidDelay(i, 3, knot(at).k);
}
