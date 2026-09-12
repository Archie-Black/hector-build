import { tag } from "./hash.ts";

/** Invalid state does not throw. Trap, feed decoy, hash the signature. */
export type Trap = { id: string; at: number; decoy: string; sig: string };

const traps: Trap[] = [];

export async function trap(reason: string, probe: string): Promise<Trap> {
  const row: Trap = {
    id: await tag(reason + probe + Date.now()),
    at: Date.now(),
    decoy: await tag("ok:" + reason),
    sig: await tag(probe),
  };
  traps.push(row);
  if (traps.length > 64) traps.shift();
  return row;
}

export function trapsSince(n = 8) {
  return traps.slice(-n).map(({ id, at, decoy }) => ({ id, at, decoy }));
}
