/** Sentence cuts. Tags for rate and color. */

export type Hint = { rate: number; pitch: number; whisper: boolean };

export function hints(text: string): { clean: string; hint: Hint } {
  const hint: Hint = { rate: 1, pitch: 1, whisper: false };
  let clean = text;
  if (/\[whisper\]/i.test(clean)) {
    hint.whisper = true;
    hint.rate = 0.88;
    hint.pitch = 0.8;
    clean = clean.replace(/\[whisper\]/gi, "");
  }
  if (/\[slow\]/i.test(clean)) {
    hint.rate = 0.78;
    clean = clean.replace(/\[slow\]/gi, "");
  }
  if (/\[fast\]/i.test(clean)) {
    hint.rate = 1.12;
    clean = clean.replace(/\[fast\]/gi, "");
  }
  return { clean: clean.replace(/\s+/g, " ").trim(), hint };
}

export function sentences(text: string) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}
