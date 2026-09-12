/** Spectral Horizon world. Same contract as native/horizon. */
export type Act = 0 | 1 | 2 | 3;

export type Horizon = {
  tick: number;
  x: number;
  inv: number;
  act: Act;
};

function knot(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function boot(): Horizon {
  return { tick: 0, x: 0, inv: knot("oasis"), act: 0 };
}

export function step(w: Horizon, dt = 1 / 60): Horizon {
  const tick = w.tick + 1;
  const x = w.x + dt * 0.01;
  const act = (tick % 4) as Act;
  return { tick, x, inv: knot(`${tick}:${x.toFixed(4)}`), act };
}

export const ACT = ["idle", "hunt", "cover", "help"] as const;
