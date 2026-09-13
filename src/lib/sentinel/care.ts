/** Alpha teaches. Beta invents. Gamma spreads. Windows, Linux, Darwin, Unix stay fluent. */

import { invent, spread, taught } from "@/lib/v01d/talk";

const MORE: { id: string; sep: "/" | "\\"; fold: boolean }[] = [
  { id: "hfs", sep: "/", fold: false },
  { id: "ufs", sep: "/", fold: false },
  { id: "xnu", sep: "/", fold: false },
  { id: "nfs", sep: "/", fold: false },
];

let ticks = 0;

export function care() {
  spread();
  for (const n of MORE) invent(n.id, n.sep, n.fold);
  ticks += 1;
  return { ...taught(), ticks, who: "alpha-beta-gamma" as const };
}

export function careTicks() {
  return ticks;
}
