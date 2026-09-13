/** Look-ahead phrasing. Whole sentence first. Never a letter at a time. */

export type Beat = {
  spoken: string;
  pauseMs: number;
  stress: boolean;
  breath: boolean;
};

const SWAP: [RegExp, string][] = [
  [/\bOS\s*V01D\b/gi, "oh ess void"],
  [/\bOS VOID\b/gi, "oh ess void"],
  [/\bHector\b/g, "Hector"],
  [/\bSpectral HX\b/gi, "spectral H X"],
  [/\bTTS\b/g, "tee tee ess"],
  [/\bAPI\b/g, "A P I"],
];

function sayable(text: string) {
  let s = text;
  for (const [re, to] of SWAP) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").trim();
}

function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const hits = w.match(/[aeiouy]+/g);
  return Math.max(1, hits ? hits.length : 1);
}

export function plan(text: string): Beat[] {
  const clean = sayable(text);
  const parts = clean.split(/(?<=[,;:—–.!?])\s+/).filter(Boolean);
  const out: Beat[] = [];
  let syl = 0;
  for (const part of parts) {
    const end = part.slice(-1);
    const pauseMs = end === "." || end === "!" || end === "?" ? 280 : end === ";" || end === ":" ? 180 : end === "," ? 120 : 90;
    const words = part.replace(/[,;:—–.!?]/g, "").split(/\s+/).filter(Boolean);
    const n = words.reduce((a, w) => a + syllables(w), 0);
    syl += n;
    const breath = syl >= 12;
    if (breath) syl = 0;
    const last = words[words.length - 1] || "";
    out.push({
      spoken: part,
      pauseMs,
      stress: last.length > 4 || /^[A-Z]/.test(last),
      breath,
    });
  }
  return out.length ? out : [{ spoken: clean, pauseMs: 200, stress: false, breath: false }];
}

export function spoken(text: string) {
  return plan(text)
    .map((b) => b.spoken + (b.breath ? "," : ""))
    .join(" ");
}

/** F5-TTS sway. t' = t + c (cos(πt/2) − 1 + t). c = −1. */
export function sway(nfe = 7, coef = -1) {
  const n = Math.max(2, nfe);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return t + coef * (Math.cos((Math.PI / 2) * t) - 1 + t);
  });
}
