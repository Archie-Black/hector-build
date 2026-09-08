const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPH[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPH[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPH.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function randomSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

async function hmacSha1(key: Uint8Array, msg: Uint8Array) {
  const cryptoKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msg as BufferSource);
  return new Uint8Array(sig);
}

export async function totp(secret: string, at = Date.now(), step = 30, digits = 6) {
  const key = base32Decode(secret);
  const counter = Math.floor(at / 1000 / step);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter);
  const h = await hmacSha1(key, new Uint8Array(buf));
  const offset = h[h.length - 1] & 0xf;
  const bin = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  const otp = (bin % 10 ** digits).toString().padStart(digits, "0");
  return otp;
}

export async function totpOk(secret: string, code: string) {
  const now = Date.now();
  const guess = code.replace(/\s/g, "");
  for (const d of [-1, 0, 1]) {
    if ((await totp(secret, now + d * 30_000)) === guess) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, account = "Hector Build") {
  return `otpauth://totp/${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent("Hector Build")}&period=30&digits=6`;
}
