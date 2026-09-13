/** Horizon protocol on the VFS. Put and get. Native paths stay native. */

import { fire } from "@/lib/hector/brain";
import { improve } from "@/lib/hector/vfs-learn";
import { native } from "./vfs";
import { pack, unpack, type Tree } from "./horizon";

const DISK = new Map<string, Tree>();

export function resetDisk() {
  DISK.clear();
}

export function put(path: string, buf: Uint8Array) {
  const p = native(path).path;
  fire(`put ${p}`);
  const t = pack(buf);
  improve(t);
  DISK.set(p, t);
  return t;
}

export function get(path: string) {
  const t = DISK.get(native(path).path);
  return t ? unpack(t) : null;
}

export function stat(path: string) {
  const t = DISK.get(native(path).path);
  if (!t) return null;
  return { path: native(path).path, bytes: t.bytes, pages: t.pages, root: t.root };
}

export function listing() {
  return [...DISK.keys()];
}
