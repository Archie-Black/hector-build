import { teach } from "./adapt";
import { RATE, render } from "./klatt";
import { frames, phones, tags } from "./phones";
import { pick } from "./stack";

export type Utter = { pcm: Float32Array; rate: number; engine: string };

export function speak(text: string): Utter {
  const engine = pick();
  const { clean, mood } = tags(text);
  const fr = frames(phones(clean), mood);
  const pcm = render(fr);
  teach(fr);
  return { pcm, rate: RATE, engine };
}

export function wav(pcm: Float32Array, rate = RATE): Uint8Array {
  const data = pcm.length * 2;
  const buf = new ArrayBuffer(44 + data);
  const v = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + data, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, data, true);
  let o = 44;
  for (const x of pcm) {
    const s = Math.max(-1, Math.min(1, x));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Uint8Array(buf);
}

export function play(pcm: Float32Array, rate = RATE) {
  const AC = globalThis.AudioContext || (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const buf = ctx.createBuffer(1, pcm.length, rate);
  buf.getChannelData(0).set(pcm);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}
