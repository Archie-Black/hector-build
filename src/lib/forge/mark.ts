/** PCM watermark. LSB payload plus a quiet spread. Lives in the WAV, not in ID3. */

function chips(key: string, n: number) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  const out = new Int8Array(n);
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ i, 16777619);
    out[i] = h & 1 ? 1 : -1;
  }
  return out;
}

function clamp(n: number) {
  return Math.max(-32766, Math.min(32766, n | 0));
}

export function mark(pcm: Int16Array, key: string, amp = 6) {
  const c = chips(key, 64);
  const out = pcm.slice();
  for (let i = 0; i < out.length; i++) {
    const chip = c[i % 64]!;
    const s = clamp(out[i]! + chip * amp);
    out[i] = (s & ~1) | (chip > 0 ? 1 : 0);
  }
  return out;
}

export function hear(pcm: Int16Array, key: string) {
  if (!pcm.length) return 0;
  const c = chips(key, 64);
  let hits = 0;
  for (let i = 0; i < pcm.length; i++) {
    const want = c[i % 64]! > 0 ? 1 : 0;
    if ((pcm[i]! & 1) === want) hits += 1;
  }
  return hits / pcm.length;
}
