import { LAW } from "@/lib/hector/unique";

const MAGIC = [0x47, 0x48, 0x53, 0x54]; // GHST
const MARK = "DKZ";

function stream(n: number) {
  const key = `${LAW.id}:${LAW.by}:${MARK}`;
  const out = new Uint8Array(n);
  let a = 1;
  let b = 7;
  for (let i = 0; i < n; i++) {
    a = (a * 1103515245 + key.charCodeAt(i % key.length) + b) >>> 0;
    b = (b + a * 13 + i) >>> 0;
    out[i] = (a ^ (b >>> 8)) & 255;
  }
  return out;
}

/** Hector-only blob. Knot-braided. Other mouths see noise. */
export function wrap(plain: string): Uint8Array {
  const body = new TextEncoder().encode(plain);
  const s = stream(body.length);
  const ct = body.map((b, i) => b ^ s[i]);
  const out = new Uint8Array(4 + 1 + ct.length + 3);
  out.set(MAGIC, 0);
  out[4] = 1;
  out.set(ct, 5);
  out.set([MARK.charCodeAt(0), MARK.charCodeAt(1), MARK.charCodeAt(2)], 5 + ct.length);
  return out;
}

export function unwrap(buf: Uint8Array): string | null {
  if (buf.length < 8) return null;
  if (buf[0] !== 0x47 || buf[1] !== 0x48 || buf[2] !== 0x53 || buf[3] !== 0x54) return null;
  if (buf[4] !== 1) return null;
  const mark = buf.subarray(buf.length - 3);
  if (String.fromCharCode(mark[0], mark[1], mark[2]) !== MARK) return null;
  const ct = buf.subarray(5, buf.length - 3);
  const s = stream(ct.length);
  const body = ct.map((b, i) => b ^ s[i]);
  return new TextDecoder().decode(body);
}

export function isGhstkrt(name: string) {
  return /\.ghstkrt$/i.test(name);
}

export function toB64(buf: Uint8Array) {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromB64(b64: string) {
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
