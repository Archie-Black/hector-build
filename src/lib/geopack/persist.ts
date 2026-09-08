import type { PackedVolume } from "./volume";

const DB = "hector-geopack-v1";
const STORE = "volume";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVolume(vol: PackedVolume) {
  if (typeof indexedDB === "undefined") return false;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(vol, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return true;
}

export async function loadVolume(): Promise<PackedVolume | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const vol = await new Promise<PackedVolume | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as PackedVolume) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return vol;
}

export function volumeBlob(vol: PackedVolume) {
  const json = JSON.stringify({
    ...vol,
    chunks: vol.chunks.map((c) => ({
      ...c,
      data: btoa(String.fromCharCode(...c.data)),
    })),
  });
  return new Blob([json], { type: "application/x-geopack+json" });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveBlobToFile(blob: Blob, name: string) {
  const picker = (window as Window & {
    showSaveFilePicker?: (opts: { suggestedName: string }) => Promise<FileSystemFileHandle>;
  }).showSaveFilePicker;
  if (!picker) {
    downloadBlob(blob, name);
    return "download";
  }
  const handle = await picker({ suggestedName: name });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return "file";
}
