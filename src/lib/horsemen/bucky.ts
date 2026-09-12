/** Glass soccer ball: truncated icosahedron. Hexes are desks. English, not math. */
export type Vec = [number, number, number];
export type Face = { i: number; kind: "hex" | "pent"; verts: Vec[]; n: Vec };

const T = (1 + Math.sqrt(5)) / 2;

const ICO: Vec[] = [
  [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
  [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
  [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1],
];

const ICO_FACES: number[][] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

function add(a: Vec, b: Vec): Vec { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub(a: Vec, b: Vec): Vec { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function sc(a: Vec, s: number): Vec { return [a[0] * s, a[1] * s, a[2] * s]; }
function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: Vec, b: Vec) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(a: Vec): Vec {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return sc(a, 1 / l);
}

function lerp(a: Vec, b: Vec, t: number): Vec {
  return add(sc(a, 1 - t), sc(b, t));
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function soccer(): Face[] {
  const mid = new Map<string, [Vec, Vec]>();
  for (const f of ICO_FACES) {
    for (let k = 0; k < 3; k++) {
      const a = f[k];
      const b = f[(k + 1) % 3];
      const key = edgeKey(a, b);
      if (mid.has(key)) continue;
      const pa = ICO[a];
      const pb = ICO[b];
      const t1 = a < b ? 1 / 3 : 2 / 3;
      const t2 = a < b ? 2 / 3 : 1 / 3;
      mid.set(key, [norm(lerp(pa, pb, t1)), norm(lerp(pa, pb, t2))]);
    }
  }
  const faces: Face[] = [];
  ICO_FACES.forEach((f, i) => {
    const verts: Vec[] = [];
    for (let k = 0; k < 3; k++) {
      const a = f[k];
      const b = f[(k + 1) % 3];
      const pair = mid.get(edgeKey(a, b))!;
      if (a < b) {
        verts.push(pair[0], pair[1]);
      } else {
        verts.push(pair[1], pair[0]);
      }
    }
    const c = norm(verts.reduce((p, v) => add(p, v), [0, 0, 0] as Vec));
    faces.push({ i, kind: "hex", verts, n: c });
  });
  for (let v = 0; v < 12; v++) {
    const ring: Vec[] = [];
    for (const f of ICO_FACES) {
      const idx = f.indexOf(v);
      if (idx < 0) continue;
      const a = f[idx];
      const b = f[(idx + 1) % 3];
      const pair = mid.get(edgeKey(a, b))!;
      ring.push(a < b ? pair[0] : pair[1]);
    }
    if (ring.length < 4) continue;
    const c = norm(ring.reduce((p, x) => add(p, x), [0, 0, 0] as Vec));
    faces.push({ i: 20 + v, kind: "pent", verts: ring, n: c });
  }
  return faces;
}

export function rotY(v: Vec, a: number): Vec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}
export function rotX(v: Vec, a: number): Vec {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

export { add, sub, sc, cross, dot, norm };

export const USER_FACES = 5;

export function english(filled: number[], hectorReady: number, joined: boolean): string {
  if (joined) return "Hector joined every face. The pieces are one thing now, like atoms that found their molecule.";
  const n = filled.length;
  if (n === 0 && hectorReady === 0) {
    return "Each hex is a desk. Empty faces are Hector's. He works quiet until the ball is full.";
  }
  if (n >= USER_FACES) {
    return "Your five desks all hold a piece. Hector can join them. Nothing is lost.";
  }
  if (hectorReady > 8) {
    return `You have ${n} desk${n === 1 ? "" : "s"} in play. Hector already filled ${hectorReady} hidden faces. When yours are ready, he joins.`;
  }
  return `${n} of 5 desks have work. A face is a piece. An edge is how two pieces touch. The ball is the whole job.`;
}
