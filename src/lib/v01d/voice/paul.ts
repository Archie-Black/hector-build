/** One mouth. Short phrases. Silence between. SAM reciter. */

import SamJs from "sam-js";
import { bus, unlock } from "../sound";
import { resample } from "./klatt";
import { render as klatt, RATE as KLATT_RATE } from "./klatt";
import { frames, phones, tags } from "./phones";

export const PAUL_RATE = 22050;

const mouth = new SamJs({
  pitch: 68,
  speed: 76,
  throat: 108,
  mouth: 102,
});

const cache = new Map<string, Float32Array>();
let talking: AudioBufferSourceNode | null = null;

function reciter(text: string) {
  return text
    .replace(/\bOS\s*V01D\b/gi, "oh ess void")
    .replace(/\bOS VOID\b/gi, "oh ess void")
    .replace(/\bStephen Hawking\b/gi, "hawking")
    .replace(/[:;]/g, ".")
    .replace(/[^a-zA-Z0-9 .',?-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bits(text: string) {
  return reciter(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function gap(sec = 0.24) {
  return new Float32Array(Math.floor(PAUL_RATE * sec));
}

function join(parts: Float32Array[]) {
  const sil = gap();
  let n = 0;
  for (const p of parts) n += p.length + sil.length;
  const out = new Float32Array(Math.max(1, n - sil.length));
  let o = 0;
  parts.forEach((p, i) => {
    out.set(p, o);
    o += p.length;
    if (i < parts.length - 1) {
      o += sil.length;
    }
  });
  return out;
}

function one(line: string): Float32Array {
  try {
    const buf = mouth.buf32(line);
    if (buf instanceof Float32Array && buf.length > 64) return buf;
  } catch {
    /* formant */
  }
  const { clean: c, mood } = tags(line);
  return klatt(frames(phones(c), mood), KLATT_RATE);
}

export function pcm(text: string): Float32Array {
  const key = reciter(text);
  const hit = cache.get(key);
  if (hit) return hit;
  const lines = bits(key);
  const out = join((lines.length ? lines : [key]).map(one));
  cache.set(key, out);
  return out;
}

export function say(text: string) {
  unlock();
  const b = bus();
  if (!b) return () => {};
  const raw = pcm(text);
  const data = resample(raw, PAUL_RATE, b.ac.sampleRate);
  const buf = b.ac.createBuffer(1, data.length, b.ac.sampleRate);
  buf.getChannelData(0).set(data);
  try {
    talking?.stop();
  } catch {
    /* */
  }
  const src = b.ac.createBufferSource();
  src.buffer = buf;
  src.connect(b.gain);
  talking = src;
  src.onended = () => {
    if (talking === src) talking = null;
  };
  src.start();
  return () => {
    try {
      if (talking === src) src.stop();
    } catch {
      /* */
    }
  };
}

export function seconds(text: string) {
  return pcm(text).length / PAUL_RATE;
}
