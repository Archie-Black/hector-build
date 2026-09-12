import { retain, type Session } from "./retain";

export type Ltv = {
  n: number;
  d1: number;
  churn: number;
  lives: number;
  arpu: number;
  money: number;
  time: number;
  note: string;
};

/** LTV from sessions. Money only if they paid. Time always. */
export function ltv(rows: Session[], arpu = 0): Ltv {
  const r = retain(rows);
  const churn = r.d1 <= 0 ? 1 : Math.min(1, Math.max(0.05, 1 - r.d1));
  const lives = 1 / churn;
  const money = arpu * lives;
  const time = r.median * lives;
  return {
    n: r.n,
    d1: r.d1,
    churn,
    lives,
    arpu,
    money,
    time,
    note:
      arpu <= 0
        ? "Shareware. LTV is time, not cash. Do not buy ads for a free key."
        : money < arpu * 2
          ? "They barely cover a second session. Fix the loop before you spend."
          : "They stay. Still no loot boxes. Still no fake stars.",
  };
}
