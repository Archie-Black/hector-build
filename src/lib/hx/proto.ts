/** Spectral HX protocol memory. Horizon VFS is first. It keeps the ones that work. */

export type Proto = { id: string; fill: number; hits: number; cell: number; gen: number };

const P = new Map<string, Proto>();

export function resetProto() {
  P.clear();
}

export function know(id: string, fill: number, cell: number, gen = 0) {
  const p = P.get(id) || { id, fill: 0, hits: 0, cell, gen };
  p.hits += 1;
  p.fill += 0.25 * (fill - p.fill);
  p.cell = cell;
  p.gen = gen;
  P.set(id, p);
  return p;
}

export function of(id: string) {
  return P.get(id);
}

export function learned() {
  return [...P.values()];
}

export function sayProto() {
  const h = of("horizon");
  if (!h) return "Spectral HX is ready to learn the horizon protocol.";
  return `Spectral HX knows horizon gen ${h.gen}. ${h.hits} packs. Grain ${h.cell} B. Fill ${(h.fill * 100).toFixed(0)}%. Two generations ahead.`;
}
