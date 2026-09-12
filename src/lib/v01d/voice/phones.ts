import type { Frame } from "./frame";

type Phone = { f1: number; f2: number; f3: number; v: boolean; ms: number; z1?: number };

const P: Record<string, Phone> = {
  AA: { f1: 700, f2: 1220, f3: 2600, v: true, ms: 90 },
  AE: { f1: 660, f2: 1720, f3: 2410, v: true, ms: 90 },
  AH: { f1: 620, f2: 1220, f3: 2550, v: true, ms: 70 },
  AO: { f1: 570, f2: 840, f3: 2410, v: true, ms: 90 },
  EH: { f1: 530, f2: 1840, f3: 2480, v: true, ms: 80 },
  IY: { f1: 270, f2: 2290, f3: 3010, v: true, ms: 90 },
  IH: { f1: 390, f2: 1990, f3: 2550, v: true, ms: 70 },
  OW: { f1: 570, f2: 840, f3: 2410, v: true, ms: 100 },
  UW: { f1: 300, f2: 870, f3: 2240, v: true, ms: 90 },
  ER: { f1: 490, f2: 1350, f3: 1690, v: true, ms: 90 },
  B: { f1: 200, f2: 800, f3: 2100, v: true, ms: 40 },
  D: { f1: 300, f2: 1700, f3: 2600, v: true, ms: 40 },
  G: { f1: 250, f2: 1400, f3: 2200, v: true, ms: 40 },
  P: { f1: 200, f2: 900, f3: 2200, v: false, ms: 40 },
  T: { f1: 350, f2: 1800, f3: 2700, v: false, ms: 40 },
  K: { f1: 300, f2: 1600, f3: 2500, v: false, ms: 40 },
  F: { f1: 340, f2: 1100, f3: 2500, v: false, ms: 60 },
  S: { f1: 400, f2: 1800, f3: 3500, v: false, ms: 70 },
  SH: { f1: 300, f2: 1800, f3: 2200, v: false, ms: 80 },
  TH: { f1: 350, f2: 1400, f3: 2500, v: false, ms: 60 },
  V: { f1: 340, f2: 1100, f3: 2500, v: true, ms: 60 },
  Z: { f1: 400, f2: 1800, f3: 3000, v: true, ms: 60 },
  M: { f1: 250, f2: 1000, f3: 2200, v: true, ms: 70, z1: 750 },
  N: { f1: 270, f2: 1400, f3: 2500, v: true, ms: 70, z1: 1450 },
  L: { f1: 360, f2: 1200, f3: 2600, v: true, ms: 70 },
  R: { f1: 400, f2: 1100, f3: 1600, v: true, ms: 70 },
  W: { f1: 300, f2: 610, f3: 2150, v: true, ms: 60 },
  Y: { f1: 300, f2: 2200, f3: 3000, v: true, ms: 50 },
  HH: { f1: 400, f2: 1400, f3: 2400, v: false, ms: 50 },
  SIL: { f1: 400, f2: 1400, f3: 2400, v: false, ms: 40 },
};

const LETTER: Record<string, string> = {
  a: "AE", e: "EH", i: "IH", o: "AA", u: "AH", y: "IY",
  b: "B", c: "K", d: "D", f: "F", g: "G", h: "HH", j: "D",
  k: "K", l: "L", m: "M", n: "N", p: "P", q: "K", r: "R",
  s: "S", t: "T", v: "V", w: "W", x: "K", z: "Z",
};

export type Mood = { f0: number; av: number; af: number; stretch: number };

export const PAUL: Mood = { f0: 118, av: 0.42, af: 0.02, stretch: 1 };

export function tags(text: string): { clean: string; mood: Mood } {
  let mood = { ...PAUL };
  let clean = text;
  if (/\[whisper\]/i.test(clean)) {
    mood = { f0: 110, av: 0.08, af: 0.22, stretch: 1.15 };
    clean = clean.replace(/\[whisper\]/gi, "");
  }
  if (/\[sigh\]/i.test(clean)) {
    mood = { f0: 90, av: 0.12, af: 0.28, stretch: 1.6 };
    clean = clean.replace(/\[sigh\]/gi, "hh aa");
  }
  if (/\[laugh\]/i.test(clean)) {
    mood = { f0: 160, av: 0.5, af: 0.08, stretch: 0.7 };
    clean = clean.replace(/\[laugh\]/gi, "hh ah hh ah");
  }
  return { clean: clean.replace(/\s+/g, " ").trim(), mood };
}

export function phones(text: string): string[] {
  const out: string[] = [];
  const s = text.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === "th") {
      out.push("TH");
      i++;
      continue;
    }
    if (two === "sh") {
      out.push("SH");
      i++;
      continue;
    }
    if (two === "ch") {
      out.push("SH");
      i++;
      continue;
    }
    const ch = s[i];
    if (ch === " " || ch === "." || ch === ",") {
      out.push("SIL");
      continue;
    }
    out.push(LETTER[ch] || "AH");
  }
  return out.length ? out : ["AH"];
}

export function frames(phonesList: string[], mood: Mood): Frame[] {
  const out: Frame[] = [];
  for (const p of phonesList) {
    const ph = P[p] || P.AH;
    const n = Math.max(2, Math.round((ph.ms * mood.stretch) / 10));
    for (let i = 0; i < n; i++) {
      out.push({
        f0: ph.v ? mood.f0 * (1 + 0.03 * Math.sin(out.length / 8)) : 0,
        av: ph.v ? mood.av : 0,
        af: ph.v ? mood.af : Math.max(0.18, mood.af),
        f1: ph.f1,
        f2: ph.f2,
        f3: ph.f3,
        b1: 90,
        b2: 110,
        b3: 170,
        z1: ph.z1,
        bz1: ph.z1 ? 80 : undefined,
      });
    }
  }
  return out;
}
