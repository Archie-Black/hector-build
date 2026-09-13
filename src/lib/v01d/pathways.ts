/** Cognitive metamorphic pathways. Same thought, new shape. UE/Godot share this math. */

const N = 3;

export type Morph = "keep" | "reduce" | "slide" | "molt";

export type Thought = {
  writhe: number;
  perm: number[];
  classId: number;
  glue: boolean;
  score: number;
  delayMs: number;
  morph: Morph;
};

function sigma(p: number[], i: number) {
  const a = Math.abs(i) - 1;
  const q = p.slice();
  const t = q[a];
  q[a] = q[a + 1];
  q[a + 1] = t;
  return q;
}

export function word(text: string) {
  const toks = text.toLowerCase().split(/\s+/).filter(Boolean);
  const out: number[] = [];
  for (const t of toks) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    const gen = (h % 2) + 1;
    const sign = h & 1 ? 1 : -1;
    out.push(sign * gen);
  }
  return out.length ? out : [1];
}

export function act(w: number[]) {
  let p = [0, 1, 2];
  let writhe = 0;
  for (const g of w) {
    p = sigma(p, g);
    writhe += g > 0 ? 1 : -1;
  }
  return { perm: p, writhe };
}

function cycleType(p: number[]) {
  const seen = [false, false, false];
  const lens: number[] = [];
  for (let i = 0; i < N; i++) {
    if (seen[i]) continue;
    let n = 0;
    let j = i;
    while (!seen[j]) {
      seen[j] = true;
      j = p[j];
      n++;
    }
    lens.push(n);
  }
  return lens.sort((a, b) => b - a).join("");
}

export function classId(perm: number[], writhe: number) {
  return Number.parseInt(cycleType(perm), 10) * 1000 + ((writhe + 256) & 255);
}

export function family(perm: number[]) {
  return cycleType(perm);
}

export function reduce(w: number[]) {
  const s: number[] = [];
  for (const g of w) {
    if (s.length && s[s.length - 1] === -g) s.pop();
    else s.push(g);
  }
  return s.length ? s : [1];
}

export function slide(w: number[]) {
  const s = w.slice();
  for (let i = 0; i < s.length - 2; i++) {
    if (s[i] === 1 && s[i + 1] === 2 && s[i + 2] === 1) {
      s[i] = 2;
      s[i + 1] = 1;
      s[i + 2] = 2;
      break;
    }
    if (s[i] === 2 && s[i + 1] === 1 && s[i + 2] === 2) {
      s[i] = 1;
      s[i + 1] = 2;
      s[i + 2] = 1;
      break;
    }
  }
  return s;
}

export function molt(w: number[], targetWrithe: number) {
  let cur = reduce(w);
  let wr = act(cur).writhe;
  while (wr < targetWrithe) {
    cur = cur.concat([1, 1]);
    wr += 2;
  }
  while (wr > targetWrithe) {
    cur = cur.concat([-1, -1]);
    wr -= 2;
  }
  return cur;
}

export function score(perm: number[], writhe: number) {
  const idx = [perm[0], perm[1], Math.abs(writhe) % 3];
  let v = [1, 0];
  for (let k = 0; k < 3; k++) {
    const n = [0, 0];
    const i = idx[k] % 3;
    n[0] = v[0] * (1 - 0.15 * i) + v[1] * 0.2;
    n[1] = v[0] * 0.2 + v[1] * (1 - 0.1 * i);
    const z = Math.hypot(n[0], n[1]) || 1;
    v = [n[0] / z, n[1] / z];
  }
  return Math.abs(v[0]);
}

type Live = { classId: number; writhe: number; family: string; hits: Record<number, number> };

let live: Live = { classId: 0, writhe: 0, family: "", hits: {} };

export function resetPath() {
  live = { classId: 0, writhe: 0, family: "", hits: {} };
}

export function think(text: string): Thought {
  const raw = word(text);
  let w = reduce(raw);
  let morph: Morph = w.length < raw.length ? "reduce" : "keep";
  const slid = slide(w);
  if (slid.join(",") !== w.join(",")) {
    w = slid;
    morph = "slide";
  }
  let { perm, writhe } = act(w);
  let id = classId(perm, writhe);
  let glue = live.classId !== 0 && id === live.classId;
  if (!glue && live.classId && family(perm) === live.family && (writhe - live.writhe) % 2 === 0) {
    w = molt(w, live.writhe);
    ({ perm, writhe } = act(w));
    id = classId(perm, writhe);
    glue = id === live.classId;
    morph = "molt";
  }
  live.hits[id] = (live.hits[id] || 0) + 1;
  if (!glue) {
    live.classId = id;
    live.writhe = writhe;
    live.family = family(perm);
  }
  const sc = score(perm, writhe);
  const habit = Math.min(2, 1 + (live.hits[id] || 1) * 0.04);
  return {
    writhe,
    perm,
    classId: id,
    glue,
    score: sc,
    delayMs: Math.round((28 + (1 - sc) * 120) / habit),
    morph,
  };
}

export function awake() {
  resetPath();
  return { strands: N, live: live.classId };
}
