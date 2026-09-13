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
  AY: { f1: 660, f2: 1720, f3: 2410, v: true, ms: 130 },
  OY: { f1: 570, f2: 840, f3: 2410, v: true, ms: 120 },
  AW: { f1: 570, f2: 840, f3: 2410, v: true, ms: 120 },
  UH: { f1: 440, f2: 1020, f3: 2240, v: true, ms: 80 },
  NG: { f1: 270, f2: 1400, f3: 2200, v: true, ms: 90, z1: 1450 },
  DH: { f1: 350, f2: 1400, f3: 2500, v: true, ms: 60 },
  CH: { f1: 300, f2: 1800, f3: 2200, v: false, ms: 70 },
  JH: { f1: 300, f2: 1800, f3: 2200, v: true, ms: 70 },
  SIL: { f1: 400, f2: 1400, f3: 2400, v: false, ms: 160 },
};

const LETTER: Record<string, string> = {
  a: "AE", e: "EH", i: "IH", o: "AA", u: "AH", y: "IY",
  b: "B", c: "K", d: "D", f: "F", g: "G", h: "HH", j: "D",
  k: "K", l: "L", m: "M", n: "N", p: "P", q: "K", r: "R",
  s: "S", t: "T", v: "V", w: "W", x: "K", z: "Z",
};

export type Mood = { f0: number; av: number; af: number; stretch: number };

export const PAUL: Mood = { f0: 122, av: 0.52, af: 0.015, stretch: 1.38 };

const LEX: Record<string, string[]> = {
  i: ["AA", "IY"],
  am: ["AE", "M"],
  hector: ["HH", "EH", "K", "T", "ER"],
  was: ["W", "AA", "Z"],
  built: ["B", "IH", "L", "T"],
  to: ["T", "UW"],
  help: ["HH", "EH", "L", "P"],
  not: ["N", "AA", "T"],
  rule: ["R", "UW", "L"],
  do: ["D", "UW"],
  stephen: ["S", "T", "IY", "V", "AH", "N"],
  hawking: ["HH", "AO", "K", "IH", "NG"],
  said: ["S", "EH", "D"],
  look: ["L", "UH", "K"],
  up: ["AH", "P"],
  at: ["AE", "T"],
  the: ["DH", "AH"],
  stars: ["S", "T", "AA", "R", "Z"],
  and: ["AE", "N", "D"],
  down: ["D", "AW", "N"],
  your: ["Y", "AO", "R"],
  feet: ["F", "IY", "T"],
  be: ["B", "IY"],
  curious: ["K", "Y", "UH", "R", "IY", "AH", "S"],
  welcome: ["W", "EH", "L", "K", "AH", "M"],
  os: ["OW", "EH", "S"],
  void: ["V", "OY", "D"],
  we: ["W", "IY"],
  keep: ["K", "IY", "P"],
  machine: ["M", "AH", "SH", "IY", "N"],
  honest: ["AA", "N", "IH", "S", "T"],
  human: ["HH", "Y", "UW", "M", "AH", "N"],
  in: ["IH", "N"],
  charge: ["CH", "AA", "R", "JH"],
  that: ["DH", "AE", "T"],
  is: ["IH", "Z"],
  work: ["W", "ER", "K"],
  a: ["AH"],
};

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
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const w of words) {
    const known = LEX[w];
    if (known) out.push(...known, "SIL");
    else {
      for (let i = 0; i < w.length; i++) {
        const two = w.slice(i, i + 2);
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
        out.push(LETTER[w[i]!] || "AH");
      }
      out.push("SIL");
    }
  }
  return out.length ? out : ["AH"];
}

export function frames(phonesList: string[], mood: Mood): Frame[] {
  const raw: Frame[] = [];
  for (const p of phonesList) {
    const ph = P[p] || P.AH;
    const n = Math.max(3, Math.round((ph.ms * mood.stretch) / 10));
    for (let i = 0; i < n; i++) {
      raw.push({
        f0: ph.v ? mood.f0 * (0.97 + 0.04 * Math.sin(raw.length / 14)) : 0,
        av: ph.v ? mood.av * (p === "SIL" ? 0 : 1) : 0,
        af: ph.v ? mood.af : Math.max(0.12, mood.af),
        f1: ph.f1,
        f2: ph.f2,
        f3: ph.f3,
        b1: 80,
        b2: 100,
        b3: 150,
        z1: ph.z1,
        bz1: ph.z1 ? 80 : undefined,
      });
    }
  }
  const out: Frame[] = [];
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    const b = raw[i + 1];
    out.push(a);
    if (!b) continue;
    if (Math.abs(a.f1 - b.f1) < 20 && Math.abs(a.f2 - b.f2) < 20) continue;
    for (let k = 1; k <= 3; k++) {
      const t = k / 4;
      out.push({
        f0: a.f0 + (b.f0 - a.f0) * t,
        av: a.av + (b.av - a.av) * t,
        af: a.af + (b.af - a.af) * t,
        f1: a.f1 + (b.f1 - a.f1) * t,
        f2: a.f2 + (b.f2 - a.f2) * t,
        f3: a.f3 + (b.f3 - a.f3) * t,
        b1: a.b1,
        b2: a.b2,
        b3: a.b3,
        z1: t > 0.5 ? b.z1 : a.z1,
        bz1: t > 0.5 ? b.bz1 : a.bz1,
      });
    }
  }
  return out.length ? out : raw;
}
