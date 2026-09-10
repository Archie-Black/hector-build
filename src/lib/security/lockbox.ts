/** Device lockbox: AES-GCM, non-extractable key in IndexedDB. Ciphertext only in localStorage. */

const IDB_NAME = "hector-lockbox";
const IDB_STORE = "keys";
const IDB_KEY = "device";
const CIPHER = "hector.lockbox.v1";
const LEGACY = "hector-visitor-xai";

function b64(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((x) => {
    s += String.fromCharCode(x);
  });
  return btoa(s);
}

function unb64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deviceKey(): Promise<CryptoKey> {
  const db = await openDb();
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const req = tx.objectStore(IDB_STORE).put(key, IDB_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  return key;
}

export function redactSecrets(text: string) {
  return text
    .replace(/xai-[A-Za-z0-9_-]{8,}/g, "xai-***")
    .replace(/sk-or-[A-Za-z0-9_-]{8,}/g, "sk-or-***")
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***")
    .replace(/gsk_[A-Za-z0-9_-]{8,}/g, "gsk_***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***");
}

export async function sealPrivateKey(raw: string) {
  if (typeof window === "undefined") return;
  const value = raw.trim();
  if (!value || value === "local") {
    localStorage.removeItem(CIPHER);
    localStorage.removeItem(LEGACY);
    return;
  }
  const key = await deviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(value));
  localStorage.setItem(CIPHER, JSON.stringify({ iv: b64(iv), cipher: b64(new Uint8Array(cipher)) }));
  localStorage.removeItem(LEGACY);
}

export async function openPrivateKey(): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const legacy = localStorage.getItem(LEGACY) ?? "";
    const wrapped = localStorage.getItem(CIPHER);
    if (wrapped) {
      const parsed = JSON.parse(wrapped) as { iv: string; cipher: string };
      const key = await deviceKey();
      const raw = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: unb64(parsed.iv) as BufferSource },
        key,
        unb64(parsed.cipher) as BufferSource,
      );
      return new TextDecoder().decode(raw);
    }
    if (legacy && !/\s/.test(legacy) && legacy.length >= 12) {
      await sealPrivateKey(legacy);
      return legacy;
    }
  } catch {
    return "";
  }
  return "";
}

export async function clearPrivateKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CIPHER);
  localStorage.removeItem(LEGACY);
}
