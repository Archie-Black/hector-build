import type { Kit } from "./author";
import { ACT, type Horizon } from "./horizon";
import { fromPlay, retain } from "./retain";
import { ltv } from "./ltv";

export type Hole = { seat: "design" | "art" | "code" | "audio" | "ship"; fix: string };

export type Market = {
  hook: string;
  who: string;
  tags: string[];
  store: string;
  trailer: string[];
  post: string;
  holes: Hole[];
  never: string[];
  d1: number;
  n: number;
  lives: number;
  time: number;
  money: number;
};

const NEVER = [
  "No fake reviews.",
  "No bought stars.",
  "No lie about a team you do not have.",
  "If you cannot say the hook, fix the game.",
];

/** Marketing that improves the game. Weak pitch = weak loop. */
export function market(kit: Kit, play?: Horizon): Market {
  const hold = play ? retain([fromPlay(play)]) : retain([]);
  const worth = ltv(play ? [fromPlay(play)] : [], 0);
  const holes = [...find(kit, play), ...hold.holes];
  const hook = one(kit, holes);
  return {
    hook,
    who: "People who want a world that keeps going without a committee.",
    tags: ["solo-dev", "tqc", "hell", "windows-linux"],
    store: `${hook} ${kit.title} on OS V01D. Honest key. No rent.`,
    trailer: kit.trailer.slice(0, 3).concat(hook),
    post: `${hook} ${kit.post}`,
    holes,
    never: NEVER,
    d1: hold.d1,
    n: hold.n,
    lives: worth.lives,
    time: worth.time,
    money: worth.money,
  };
}

function one(kit: Kit, holes: Hole[]) {
  if (holes.some((h) => h.seat === "design")) return `${kit.title}: the loop is not clear yet. Play it until it is.`;
  return `${kit.title}: one person. The world does not wait.`;
}

function find(kit: Kit, play?: Horizon): Hole[] {
  const holes: Hole[] = [];
  if (kit.trailer.length < 3) holes.push({ seat: "design", fix: "Trailer has no third beat. The fail state is missing in play." });
  if (!/fail|loop|camera/i.test(kit.seats.design)) holes.push({ seat: "design", fix: "Name the fail state. Players cannot want what they cannot lose." });
  if (!/unique|no copies/i.test(kit.seats.art)) holes.push({ seat: "art", fix: "Plates must be unique. Copies sell nothing and break the law." });
  if (play && play.tick < 30) holes.push({ seat: "code", fix: "World has barely ticked. Ship after the knot holds." });
  if (play && ACT[play.act] === "idle" && play.tick > 120) holes.push({ seat: "design", fix: "Actors idle too long. Give them a want." });
  if (!holes.length) holes.push({ seat: "ship", fix: "Hook is clear. Ship Windows and Linux together. Then talk." });
  return holes;
}
