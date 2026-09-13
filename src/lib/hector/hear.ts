/** Diplomat ear. PipeWire node osv01d.diplomat.hear. Energy only. Never exec from audio. */

export const HEAR = Object.freeze({
  node: "osv01d.diplomat.hear",
  rate: 16000,
  text: "Diplomat hears the default mic through PipeWire. Voice is not a command.",
});

export function rms(pcm: ArrayLike<number>) {
  if (!pcm.length) return 0;
  let s = 0;
  for (let i = 0; i < pcm.length; i++) {
    const x = pcm[i]! / 32768;
    s += x * x;
  }
  return Math.sqrt(s / pcm.length);
}

export function voiced(pcm: ArrayLike<number>, k = 0.02) {
  return rms(pcm) >= k;
}

/** Audio never becomes a machine bin. Diplomat only. */
export function fromVoice(pcm: ArrayLike<number>) {
  if (!voiced(pcm)) return { core: "diplomat" as const, hear: false, say: "" };
  return { core: "diplomat" as const, hear: true, say: "I hear you." };
}

export function wantsHear(text: string) {
  return /\b(diplomat hear|pipewire capture|hear (me|voice)|voice input)\b/i.test(text);
}

export function sayHear() {
  return HEAR.text;
}
