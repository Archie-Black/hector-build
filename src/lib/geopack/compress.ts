const te = new TextEncoder();
const td = new TextDecoder();

export function encodeText(text: string) {
  return te.encode(text);
}

export function decodeText(bytes: Uint8Array) {
  return td.decode(bytes);
}

function blobOf(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy]);
}

export async function gzipBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") return bytes;
  const stream = blobOf(bytes).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  const out = new Uint8Array(buf);
  return out.length < bytes.length ? out : bytes;
}

export async function gunzipBytes(bytes: Uint8Array, gzipped: boolean): Promise<Uint8Array> {
  if (!gzipped || typeof DecompressionStream === "undefined") return bytes;
  const stream = blobOf(bytes).stream().pipeThrough(new DecompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", copy);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(copy).digest("hex");
}
