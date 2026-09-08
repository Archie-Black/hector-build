import { knotSeal } from "@/lib/geometry/braid";
import { otpauthUrl, randomSecret, totpOk } from "@/lib/security/totp";
import { bundleOf, geoBind, kemDecap, kemEncap, kemKeygen, mixDek } from "@/lib/security/geo-pqc";

const KEY = "hector.geometric.vault.v2";

export type VaultBlob = {
  salt: string;
  iv: string;
  cipher: string;
  geo: string;
  kemPub: string;
  kemCt: string;
  skIv: string;
  skCipher: string;
  nest: number;
};

export type VaultStore = {
  wrap: VaultBlob;
  recoveryWrap: VaultBlob;
};

export type VaultPlain = {
  totp: string;
  recovery: string[];
  secrets: Record<string, string>;
};

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

async function pwdBits(password: string, salt: Uint8Array) {
  const sealMark = knotSeal(`hector-vault:${password.length}`);
  const geo = `${sealMark.writhe}:${sealMark.det}:${sealMark.perm}`;
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password + geo), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 210_000, hash: "SHA-512" },
    base,
    256,
  );
  return new Uint8Array(bits);
}

async function aesKey(bits: Uint8Array) {
  return crypto.subtle.importKey("raw", bits as BufferSource, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function wrapBytes(key: CryptoKey, data: Uint8Array) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource);
  return { iv: b64(iv), cipher: b64(new Uint8Array(cipher)) };
}

async function unwrapBytes(key: CryptoKey, iv: string, cipher: string) {
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(iv) as BufferSource },
    key,
    unb64(cipher) as BufferSource,
  );
  return new Uint8Array(raw);
}

async function seal(plain: VaultPlain, password: string): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pwdBits(password, salt);
  const pwdKey = await aesKey(bits);
  const keys = kemKeygen();
  const enc = kemEncap(keys.publicKey);
  const bundle = bundleOf(keys.publicKey, keys.secretKey, enc.cipherText, enc.sharedSecret);
  const dek = await mixDek(bundle.shared, bits);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(plain));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, dek, data);
  const sk = await wrapBytes(pwdKey, keys.secretKey);
  const bind = geoBind(enc.cipherText);
  return {
    salt: b64(salt),
    iv: b64(iv),
    cipher: b64(new Uint8Array(cipher)),
    geo: bundle.jones,
    kemPub: b64(keys.publicKey),
    kemCt: b64(enc.cipherText),
    skIv: sk.iv,
    skCipher: sk.cipher,
    nest: bind.nest,
  };
}

async function open(blob: VaultBlob, password: string): Promise<VaultPlain> {
  const bits = await pwdBits(password, unb64(blob.salt));
  const pwdKey = await aesKey(bits);
  const sk = await unwrapBytes(pwdKey, blob.skIv, blob.skCipher);
  const ss = kemDecap(unb64(blob.kemCt), sk);
  const dek = await mixDek(ss, bits);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(blob.iv) as BufferSource },
    dek,
    unb64(blob.cipher) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(raw)) as VaultPlain;
}

export function loadStore(): VaultStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VaultStore) : null;
  } catch {
    return null;
  }
}

function saveStore(store: VaultStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

function recoveryCodes() {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const n = crypto.getRandomValues(new Uint8Array(5));
    codes.push(Array.from(n, (x) => (x % 36).toString(36)).join("").toUpperCase());
  }
  return codes;
}

export async function createVault(password: string) {
  const totp = randomSecret();
  const recovery = recoveryCodes();
  const recoveryKey = randomSecret();
  const plain: VaultPlain = { totp, recovery, secrets: {} };
  const store: VaultStore = {
    wrap: await seal(plain, password),
    recoveryWrap: await seal(plain, recoveryKey),
  };
  saveStore(store);
  const recoveryPayload = `HECTOR-VAULT\nRK=${recoveryKey}\n${recovery.join("\n")}`;
  return {
    otpauth: otpauthUrl(totp),
    recovery,
    recoveryKey,
    recoveryPayload,
    geo: store.wrap.geo,
    pqc: "ML-KEM-768",
  };
}

export async function unlockVault(password: string, code: string) {
  const store = loadStore();
  if (!store) throw new Error("No vault");
  let plain: VaultPlain;
  try {
    plain = await open(store.wrap, password);
  } catch {
    throw new Error("Password refused");
  }
  const token = code.toUpperCase().replace(/\s/g, "");
  const ok = (await totpOk(plain.totp, code)) || plain.recovery.includes(token);
  if (!ok) throw new Error("Second factor refused");
  return plain;
}

export async function recoverVault(recoveryKey: string, code: string) {
  const store = loadStore();
  if (!store) throw new Error("No vault");
  let plain: VaultPlain;
  try {
    plain = await open(store.recoveryWrap, recoveryKey.trim());
  } catch {
    throw new Error("Recovery key refused");
  }
  const token = code.toUpperCase().replace(/\s/g, "");
  const ok = (await totpOk(plain.totp, code)) || plain.recovery.includes(token);
  if (!ok) throw new Error("Second factor refused");
  return plain;
}

export function vaultExists() {
  return Boolean(loadStore());
}

export async function putSecret(password: string, totp: string, name: string, value: string) {
  const plain = await unlockVault(password, totp);
  plain.secrets[name] = value;
  const store = loadStore();
  if (!store) throw new Error("No vault");
  store.wrap = await seal(plain, password);
  saveStore(store);
}

export function clearVault() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem("hector.geometric.vault.v1");
}
