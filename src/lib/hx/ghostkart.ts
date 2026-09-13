/** Ghost Kart: Warzone. Pacejka slip. Grid scream. Carnage. */

export type Tape = { x: number; y: number; yaw: number; v: number; t: number };

export type Kart = {
  x: number;
  y: number;
  yaw: number;
  v: number;
  rpm: number;
  hp: number;
  drift: number;
  heat: number;
  ghost: boolean;
  tape: Tape[];
};

export function boot(): Kart {
  return { x: 0, y: 0, yaw: 0, v: 0, rpm: 800, hp: 100, drift: 0, heat: 0, ghost: false, tape: [] };
}

function pacejka(slip: number, B = 10, C = 1.9, D = 1, E = 0.97) {
  const x = B * slip;
  return D * Math.sin(C * Math.atan(x - E * (x - Math.atan(x))));
}

export function step(k: Kart, thr: number, steer: number, dt: number, fire: boolean): Kart {
  const slip = steer * 0.35 + k.drift * 0.02;
  const v = Math.max(0, k.v + (pacejka(thr * 0.4) * 28 - k.v * 0.42) * dt);
  const yaw = k.yaw + (pacejka(slip) * 2.4 + steer * (0.8 + v * 0.04)) * dt;
  const next: Kart = {
    ...k,
    v,
    yaw,
    x: k.x + Math.cos(yaw) * v * dt,
    y: k.y + Math.sin(yaw) * v * dt,
    rpm: Math.min(14500, 800 + v * 420),
    drift: k.drift * 0.92 + Math.abs(steer) * v * 0.08,
    heat: fire ? 1 : k.heat * 0.94,
    hp: fire ? k.hp - 4 : k.hp,
    tape: k.ghost ? k.tape : k.tape.concat({ x: k.x, y: k.y, yaw, v, t: k.tape.length * dt }),
  };
  return next;
}

export const TITLE = "Ghost Kart: Warzone";
