import { encodeText } from "./compress";

function crc32(bytes: Uint8Array) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function u16(n: number) {
  return new Uint8Array([n & 255, (n >>> 8) & 255]);
}
function u32(n: number) {
  return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
}

function concat(parts: Uint8Array[]) {
  const n = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** LIVE ZIP (store method) for Deploy Now. GeoPack is the compressed volume. */
export function zipFiles(files: Record<string, string>) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [path, text] of Object.entries(files)) {
    const name = encodeText(path);
    const data = encodeText(text);
    const crc = crc32(data);
    const local = concat([
      encodeText("PK\u0003\u0004"),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = concat([
      encodeText("PK\u0001\u0002"),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const center = concat(centrals);
  const end = concat([
    encodeText("PK\u0005\u0006"),
    u16(0),
    u16(0),
    u16(Object.keys(files).length),
    u16(Object.keys(files).length),
    u32(center.length),
    u32(offset),
    u16(0),
  ]);
  return new Blob([concat([...locals, center, end])], { type: "application/zip" });
}
