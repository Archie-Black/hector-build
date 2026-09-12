/** DPI blinds: bucket pad, jitter, chaff. Observers see noise, not shape. */
const BUCKETS = [256, 512, 1024, 2048, 4096];

export function padToBucket(body: Uint8Array): Uint8Array {
  const need = body.length + 4;
  const bucket = BUCKETS.find((b) => b >= need) ?? Math.ceil(need / 4096) * 4096;
  const out = new Uint8Array(bucket);
  out[0] = body.length & 255;
  out[1] = (body.length >> 8) & 255;
  out[2] = (body.length >> 16) & 255;
  out[3] = (body.length >> 24) & 255;
  out.set(body, 4);
  return out;
}

export function unpad(buf: Uint8Array): Uint8Array {
  const n = buf[0] | (buf[1] << 8) | (buf[2] << 16) | (buf[3] << 24);
  if (n < 0 || n > buf.length - 4) return new Uint8Array();
  return buf.subarray(4, 4 + n);
}

export function jitterMs(max = 37) {
  return 5 + Math.floor(Math.random() * max);
}

export function chaff(n = 3): Uint8Array[] {
  return Array.from({ length: n }, (_, i) => {
    const b = new Uint8Array(BUCKETS[i % BUCKETS.length]);
    b[0] = 0xc1;
    b[1] = i & 255;
    return b;
  });
}

export function hopPort(epoch: number, base = 8443) {
  return base + ((epoch * 7919) % 400);
}
