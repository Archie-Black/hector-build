/** Spectre. Only inside OS V01D. Never bought. Never sold for cash. */

export const SPAWN = 2000;
export const ROUND = 30 * 60;

export type Wallet = {
  bank: number;
  life: number;
  earned: number;
};

export function boot(): Wallet {
  return { bank: 0, life: SPAWN, earned: 0 };
}

export function spawn(w: Wallet): Wallet {
  return { ...w, life: SPAWN };
}

export function grant(w: Wallet, n: number, why: "build" | "trade" | "play" | "mission"): Wallet {
  const add = Math.max(0, Math.floor(n));
  if (!add) return w;
  return { bank: w.bank, life: w.life + add, earned: w.earned + add };
}

export function spend(w: Wallet, n: number): Wallet | null {
  const cost = Math.max(0, Math.floor(n));
  if (w.life + w.bank < cost) return null;
  if (w.life >= cost) return { ...w, life: w.life - cost };
  return { ...w, bank: w.bank - (cost - w.life), life: 0 };
}

/** Die: the body drops what this life collected. Respawn 2000. Bank stays. */
export function die(w: Wallet): { wallet: Wallet; drop: number } {
  const drop = Math.max(0, w.life - SPAWN);
  return { wallet: { bank: w.bank, life: SPAWN, earned: w.earned }, drop };
}

/** Survive the round: keep life into the bank. */
export function survive(w: Wallet): Wallet {
  return { bank: w.bank + w.life, life: SPAWN, earned: w.earned };
}

export function total(w: Wallet) {
  return w.bank + w.life;
}
