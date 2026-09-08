import { binOfHash, binXY } from "./geometry";
import { decodeText, encodeText, gunzipBytes, gzipBytes, sha256Hex } from "./compress";

export const CHUNK = 4096;

export type PackedFile = { path: string; size: number; hashes: string[] };

export type PackedChunk = {
  hash: string;
  bin: number;
  gzip: boolean;
  raw: number;
  packed: number;
  data: Uint8Array;
};

export type PackedVolume = {
  version: 1;
  created: number;
  files: PackedFile[];
  chunks: PackedChunk[];
};

export type PackStats = {
  files: number;
  raw: number;
  packed: number;
  chunks: number;
  unique: number;
  bins: number;
  ratio: number;
  engine: "geopack";
  note: string;
};

const NOTE =
  "LIVE GeoPack userspace volume (Morton bins + gzip + content-addressed chunks). Not a kernel replacement for NTFS or ext4.";

export async function packFiles(files: Record<string, string>): Promise<PackedVolume> {
  const byHash = new Map<string, PackedChunk>();
  const packedFiles: PackedFile[] = [];
  for (const [path, text] of Object.entries(files)) {
    const bytes = encodeText(text);
    const hashes: string[] = [];
    for (let i = 0; i < bytes.length || i === 0; i += CHUNK) {
      const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
      const hash = await sha256Hex(slice);
      hashes.push(hash);
      if (!byHash.has(hash)) {
        const gz = await gzipBytes(slice);
        const gzip = gz.length < slice.length;
        byHash.set(hash, {
          hash,
          bin: binOfHash(hash),
          gzip,
          raw: slice.length,
          packed: gzip ? gz.length : slice.length,
          data: gzip ? gz : slice.slice(),
        });
      }
      if (bytes.length === 0) break;
    }
    packedFiles.push({ path, size: bytes.length, hashes });
  }
  return { version: 1, created: Date.now(), files: packedFiles, chunks: [...byHash.values()] };
}

export async function unpackFiles(vol: PackedVolume): Promise<Record<string, string>> {
  const map = new Map(vol.chunks.map((c) => [c.hash, c]));
  const files: Record<string, string> = {};
  for (const file of vol.files) {
    const parts: Uint8Array[] = [];
    let total = 0;
    for (const hash of file.hashes) {
      const chunk = map.get(hash);
      if (!chunk) continue;
      const raw = await gunzipBytes(
        chunk.data instanceof Uint8Array ? chunk.data : new Uint8Array(chunk.data as ArrayBuffer),
        chunk.gzip,
      );
      parts.push(raw);
      total += raw.length;
    }
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    files[file.path] = decodeText(out);
  }
  return files;
}

export function statsOf(vol: PackedVolume): PackStats {
  const raw = vol.files.reduce((n, f) => n + f.size, 0);
  const packed = vol.chunks.reduce((n, c) => n + c.packed, 0);
  const bins = new Set(vol.chunks.map((c) => c.bin)).size;
  return {
    files: vol.files.length,
    raw,
    packed,
    chunks: vol.files.reduce((n, f) => n + f.hashes.length, 0),
    unique: vol.chunks.length,
    bins,
    ratio: raw ? packed / raw : 1,
    engine: "geopack",
    note: NOTE,
  };
}

export function occupancy(vol: PackedVolume, grid = 16) {
  const cells = Array.from({ length: grid * grid }, () => 0);
  const scale = 256 / grid;
  for (const chunk of vol.chunks) {
    const { x, y } = binXY(chunk.bin);
    const gx = Math.min(grid - 1, Math.floor(x / scale));
    const gy = Math.min(grid - 1, Math.floor(y / scale));
    cells[gy * grid + gx] += 1;
  }
  return cells;
}

export function retrieve(vol: PackedVolume, path: string) {
  return vol.files.find((f) => f.path === path) ?? null;
}
