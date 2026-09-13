/** Spectral Horizon royale. 30 minutes. Moon. Open world. Original. */

import { ROUND, SPAWN } from "./spectre";

export type Mission = { id: string; name: string; pay: number; secret?: boolean; done: boolean };

export type Round = {
  left: number;
  alive: boolean;
  nuke: boolean;
  missions: Mission[];
};

export function boot(): Round {
  return {
    left: ROUND,
    alive: true,
    nuke: false,
    missions: [
      { id: "ridge", name: "Hold the ridge", pay: 350, done: false },
      { id: "cache", name: "Crack the cache", pay: 500, done: false },
      { id: "ghost", name: "Walk the ghosts home", pay: 280, done: false },
      { id: "nuke", name: "The quiet core", pay: 2000, secret: true, done: false },
    ],
  };
}

export function tick(r: Round, dt: number): Round {
  if (!r.alive) return r;
  const left = Math.max(0, r.left - dt);
  return { ...r, left, alive: left > 0 ? r.alive : true };
}

export function finish(m: Mission, r: Round): { round: Round; pay: number } {
  if (m.done) return { round: r, pay: 0 };
  if (m.secret && !r.missions.filter((x) => !x.secret).every((x) => x.done)) {
    return { round: r, pay: 0 };
  }
  return {
    pay: m.pay,
    round: {
      ...r,
      nuke: m.id === "nuke" ? true : r.nuke,
      missions: r.missions.map((x) => (x.id === m.id ? { ...x, done: true } : x)),
    },
  };
}

export const RULES = {
  spawn: SPAWN,
  minutes: 30,
  drop: "Die and you explode into Spectre and the power-ups you picked up this life.",
  keep: "Live the thirty. The bank keeps it.",
  cash: "No real money. Ever.",
  squad: 6,
  lanes: "Rookie, Field, Apex. An elite cannot sit in a noob drop.",
};
