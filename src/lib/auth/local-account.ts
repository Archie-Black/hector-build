const KEY = "hector.accounts.v1";
const SESSION = "hector.session.v1";
const PENDING = "hector.verify.pending.v1";

export type Account = {
  email: string;
  salt: string;
  hash: string;
  setupDone: boolean;
  verified: boolean;
};

export type Session = {
  email: string;
  at: number;
};

type Pending = {
  email: string;
  codeHash: string;
  token: string;
  exp: number;
};

function loadAll(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Account[];
  } catch {
    return [];
  }
}

function saveAll(rows: Account[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

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

async function digest(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 120_000, hash: "SHA-256" },
    base,
    256,
  );
  return b64(new Uint8Array(bits));
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return b64(new Uint8Array(buf));
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function findAccount(email: string) {
  return loadAll().find((a) => a.email === email.trim().toLowerCase()) ?? null;
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION) || "null") as Session | null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION);
}

function setSession(email: string) {
  localStorage.setItem(SESSION, JSON.stringify({ email, at: Date.now() } satisfies Session));
}

function loadPending(): Pending | null {
  try {
    return JSON.parse(localStorage.getItem(PENDING) || "null") as Pending | null;
  } catch {
    return null;
  }
}

function savePending(p: Pending | null) {
  if (!p) localStorage.removeItem(PENDING);
  else localStorage.setItem(PENDING, JSON.stringify(p));
}

function mintCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

export async function issueVerify(email: string) {
  const addr = email.trim().toLowerCase();
  const code = mintCode();
  const token = b64(crypto.getRandomValues(new Uint8Array(18)));
  savePending({
    email: addr,
    codeHash: await sha(code + addr),
    token,
    exp: Date.now() + 1000 * 60 * 60 * 24,
  });
  return { email: addr, code, token };
}

export async function createAccount(email: string, password: string, confirm: string) {
  const addr = email.trim().toLowerCase();
  if (!validEmail(addr)) throw new Error("Use a real email — it needs an @.");
  if (password.length < 8) throw new Error("Password, eight characters at least.");
  if (password !== confirm) throw new Error("Passwords do not match.");
  const rows = loadAll();
  if (rows.some((a) => a.email === addr)) throw new Error("That email already has an account. Log in.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await digest(password, salt);
  saveAll([...rows, { email: addr, salt: b64(salt), hash, setupDone: false, verified: false }]);
  return issueVerify(addr);
}

export async function signIn(email: string, password: string) {
  const addr = email.trim().toLowerCase();
  if (!validEmail(addr)) throw new Error("Use the email you signed up with.");
  const found = findAccount(addr);
  if (!found) throw new Error("No account. Create one first.");
  const hash = await digest(password, unb64(found.salt));
  if (hash !== found.hash) throw new Error("That password does not match.");
  if (!found.verified) {
    await issueVerify(addr);
    const err = new Error("Verify your email before you log in.");
    (err as Error & { needVerify?: boolean }).needVerify = true;
    throw err;
  }
  setSession(addr);
  return { session: { email: addr, at: Date.now() }, setupDone: found.setupDone };
}

export async function confirmCode(email: string, code: string) {
  const addr = email.trim().toLowerCase();
  const p = loadPending();
  if (!p || p.email !== addr) throw new Error("No pending verification. Create the account again.");
  if (p.exp < Date.now()) throw new Error("That code expired. Send a new one.");
  const got = await sha(code.trim() + addr);
  if (got !== p.codeHash) throw new Error("That code does not match.");
  saveAll(loadAll().map((a) => (a.email === addr ? { ...a, verified: true } : a)));
  savePending(null);
  setSession(addr);
  return findAccount(addr);
}

export async function confirmToken(token: string) {
  const p = loadPending();
  if (!p || p.token !== token) throw new Error("This verification link is not valid.");
  if (p.exp < Date.now()) throw new Error("This verification link expired.");
  saveAll(loadAll().map((a) => (a.email === p.email ? { ...a, verified: true } : a)));
  savePending(null);
  setSession(p.email);
  return p.email;
}

export function sessionIsVerified() {
  const s = loadSession();
  if (!s?.email) return false;
  return findAccount(s.email)?.verified === true;
}

export function markSetupDone(email: string) {
  const rows = loadAll().map((a) => (a.email === email ? { ...a, setupDone: true } : a));
  saveAll(rows);
}
