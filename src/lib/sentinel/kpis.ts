/** Self-graded KPIs. Gamma reads these. Mutation only if they get worse. */

export type Kpis = {
  ttftMs: number;
  tokensPerSec: number;
  alignment: number;
  errors: number;
  n: number;
};

const s: Kpis = { ttftMs: 0, tokensPerSec: 0, alignment: 1, errors: 0, n: 0 };

export function mark(ttftMs: number, toks: number, durMs: number, aligned: number, err: boolean) {
  const a = 0.15;
  s.n += 1;
  s.ttftMs = s.ttftMs + a * (ttftMs - s.ttftMs);
  const tps = durMs > 0 ? (toks * 1000) / durMs : 0;
  s.tokensPerSec = s.tokensPerSec + a * (tps - s.tokensPerSec);
  s.alignment = s.alignment + a * (aligned - s.alignment);
  if (err) s.errors += 1;
  return snapshot();
}

export function snapshot(): Kpis {
  return { ...s };
}

export function degraded(prev: Kpis, now: Kpis) {
  if (now.n < 8) return false;
  return now.ttftMs > prev.ttftMs * 1.4 || now.alignment < prev.alignment * 0.85 || now.errors > prev.errors + 3;
}

export function resetKpis() {
  s.ttftMs = 0;
  s.tokensPerSec = 0;
  s.alignment = 1;
  s.errors = 0;
  s.n = 0;
}
