type ShareSnap = { files: Record<string, string>; at: number };

const g = globalThis as typeof globalThis & { __hectorShares?: Map<string, ShareSnap> };

function bag() {
  g.__hectorShares ??= new Map();
  return g.__hectorShares;
}

export function putShare(id: string, files: Record<string, string>) {
  bag().set(id, { files, at: Date.now() });
}

export function getShare(id: string): ShareSnap | null {
  return bag().get(id) ?? null;
}
