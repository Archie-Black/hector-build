import type { Hole } from "./market";
import { ACT, type Act, type Horizon } from "./horizon";

export type Session = {
  id: string;
  day: number;
  ticks: number;
  last: Act;
  left: "win" | "quit" | "die";
};

export type Retain = {
  n: number;
  d1: number;
  d7: number;
  d30: number;
  median: number;
  drop: string;
  holes: Hole[];
  note: string;
};

export function fromPlay(h: Horizon, day = 0): Session {
  return {
    id: "local",
    day,
    ticks: h.tick,
    last: h.act,
    left: h.tick < 30 ? "quit" : h.act === 0 ? "quit" : "win",
  };
}

export function retain(rows: Session[]): Retain {
  const n = new Set(rows.map((r) => r.id)).size;
  const d1 = rate(rows, 1);
  const d7 = rate(rows, 7);
  const d30 = rate(rows, 30);
  const lengths = rows.map((r) => r.ticks).sort((a, b) => a - b);
  const median = lengths.length ? lengths[Math.floor(lengths.length / 2)]! : 0;
  const holes = holesFor(rows, n, d1, median);
  return {
    n,
    d1,
    d7,
    d30,
    median,
    drop: where(rows),
    holes,
    note: n < 30 ? "Too few sessions to brag. This is a lamp, not a trophy." : "Sample holds. Still not a press release.",
  };
}

function rate(rows: Session[], day: number) {
  const start = new Set(rows.filter((r) => r.day === 0).map((r) => r.id));
  if (!start.size) return 0;
  const back = new Set(rows.filter((r) => r.day === day && start.has(r.id)).map((r) => r.id));
  return back.size / start.size;
}

function where(rows: Session[]) {
  const quit = rows.filter((r) => r.left === "quit").length;
  const die = rows.filter((r) => r.left === "die").length;
  const short = rows.filter((r) => r.ticks < 30).length;
  if (short > rows.length / 2) return "First thirty ticks. The hook is not in the room.";
  if (die > quit) return "Death. Teach the fail, do not hide it.";
  if (quit) return "Quit while idle. Give them a want.";
  return "They stay. Do not get cute.";
}

function holesFor(rows: Session[], n: number, d1: number, median: number): Hole[] {
  const holes: Hole[] = [];
  if (n < 5) holes.push({ seat: "ship", fix: "Play it yourself more. Retention with one session is a diary." });
  if (d1 < 0.2 && n >= 5) holes.push({ seat: "design", fix: "D1 is under 20%. The first session does not earn the second." });
  if (median < 60) holes.push({ seat: "design", fix: "Median session is short. The loop does not pull." });
  const idle = rows.filter((r) => ACT[r.last] === "idle").length;
  if (idle > rows.length / 2) holes.push({ seat: "design", fix: "They leave on idle. Actors need a want." });
  if (!holes.length) holes.push({ seat: "ship", fix: "People come back. Ship the next beat. Do not farm vanity." });
  return holes;
}
