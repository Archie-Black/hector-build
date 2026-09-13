/** Local embedding. Nothing leaves the box. 32-d braid hash, not a cloud model. */

const D = 32;

export function embed(text: string): number[] {
  const v = new Array(D).fill(0);
  const t = text.toLowerCase();
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    v[i % D] += Math.sin((c * 13 + i) * 0.017);
    v[(i * 7) % D] += Math.cos((c * 3 + i) * 0.011);
  }
  let n = 0;
  for (const x of v) n += x * x;
  const z = Math.sqrt(n) || 1;
  return v.map((x) => x / z);
}

export function cosine(a: number[], b: number[]) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
