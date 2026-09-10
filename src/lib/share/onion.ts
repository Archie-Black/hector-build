import { createConnection, type Socket } from "node:net";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import ssh2 from "ssh2";
import type { AuthContext } from "ssh2";

const SshServer = ssh2.Server;
import { credFor } from "./room.ts";
import { isOnionHost, safeCollabCmd } from "./wire.ts";
import { ensureDefaultIdentity, ensureHostKey, isAuthorizedKey, keyStatus, maybeRotate } from "./keys.ts";

export const ONION_SOCKS = Number(process.env.HECTOR_TOR_SOCKS || 19050);
export const ONION_CONTROL = Number(process.env.HECTOR_TOR_CONTROL || 19051);
export const ONION_SSH_PORT = 2222;
export const ONION_SHARE_PORT = Number(process.env.PORT || 8080);

const TOR_DIR = join(process.cwd(), "data", "tor");
const SSH_HS = join(TOR_DIR, "hector-ssh");
const SHARE_HS = join(TOR_DIR, "hector-share");

export { isOnionHost };

export function isolateTag(bot: string, host: string) {
  return `${bot.replace(/[^a-z0-9._-]+/gi, "").slice(0, 24) || "hector"}.${host.replace(/[^a-z0-9.-]+/gi, "").slice(0, 80)}`.slice(0, 255);
}

export function socksConnect(
  destHost: string,
  destPort: number,
  opts?: number | { socksPort?: number; isolate?: string },
): Promise<Socket> {
  const socksPort = typeof opts === "number" ? opts : opts?.socksPort ?? ONION_SOCKS;
  const isolate = typeof opts === "object" && opts?.isolate ? opts.isolate.slice(0, 255) : "";
  return new Promise((resolve, reject) => {
    const sock = createConnection(socksPort, "127.0.0.1");
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error("onion socks timeout"));
    }, 25000);
    let phase: "method" | "user" | "reply" = "method";
    sock.once("connect", () => {
      sock.write(isolate ? Buffer.from([0x05, 0x02, 0x00, 0x02]) : Buffer.from([0x05, 0x01, 0x00]));
    });
    sock.on("data", (buf) => {
      if (phase === "method") {
        if (buf[0] !== 0x05) {
          clearTimeout(timer);
          sock.destroy();
          reject(new Error("onion socks"));
          return;
        }
        if (buf[1] === 0x02 && isolate) {
          const user = Buffer.from(isolate);
          const pass = Buffer.from("hx");
          sock.write(Buffer.concat([Buffer.from([0x01, user.length]), user, Buffer.from([pass.length]), pass]));
          phase = "user";
          return;
        }
        if (buf[1] !== 0x00) {
          clearTimeout(timer);
          sock.destroy();
          reject(new Error("onion socks auth"));
          return;
        }
        phase = "reply";
        const host = Buffer.from(destHost);
        sock.write(
          Buffer.concat([
            Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]),
            host,
            Buffer.from([(destPort >> 8) & 0xff, destPort & 0xff]),
          ]),
        );
        return;
      }
      if (phase === "user") {
        if (buf[1] !== 0x00) {
          clearTimeout(timer);
          sock.destroy();
          reject(new Error("onion socks user"));
          return;
        }
        phase = "reply";
        const host = Buffer.from(destHost);
        sock.write(
          Buffer.concat([
            Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]),
            host,
            Buffer.from([(destPort >> 8) & 0xff, destPort & 0xff]),
          ]),
        );
        return;
      }
      if (buf[0] !== 0x05 || buf[1] !== 0x00) {
        clearTimeout(timer);
        sock.destroy();
        reject(new Error(`onion socks ${buf[1] ?? "?"}`));
        return;
      }
      clearTimeout(timer);
      sock.removeAllListeners("data");
      resolve(sock);
    });
    sock.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function writeTorrc() {
  mkdirSync(SSH_HS, { recursive: true, mode: 0o700 });
  mkdirSync(SHARE_HS, { recursive: true, mode: 0o700 });
  mkdirSync(join(TOR_DIR, "data"), { recursive: true, mode: 0o700 });
  const body = `DataDirectory ${join(TOR_DIR, "data")}
SocksPort 127.0.0.1:${ONION_SOCKS} IsolateDestAddr IsolateDestPort IsolateSOCKSAuth IsolateClientProtocol IsolateClientAddr KeepAliveIsolateSOCKSAuth
ControlPort 127.0.0.1:${ONION_CONTROL}
CookieAuthentication 1
CookieAuthFile ${join(TOR_DIR, "data", "control_auth_cookie")}
AvoidDiskWrites 1
SafeLogging 1
LongLivedPorts 22
MaxCircuitDirtiness 600
NewCircuitPeriod 30
CircuitBuildTimeout 10
LearnCircuitBuildTimeout 1
EnforceDistinctSubnets 1
UseEntryGuards 1
NumEntryGuards 2
KeepalivePeriod 60
HiddenServiceDir ${SSH_HS}
HiddenServiceVersion 3
HiddenServicePort 22 127.0.0.1:${ONION_SSH_PORT}
HiddenServiceMaxStreams 32
HiddenServiceMaxStreamsCloseCircuit 1
HiddenServiceDir ${SHARE_HS}
HiddenServiceVersion 3
HiddenServicePort 80 127.0.0.1:${ONION_SHARE_PORT}
Log notice file ${join(TOR_DIR, "tor.log")}
`;
  writeFileSync(join(TOR_DIR, "torrc"), body, { mode: 0o600 });
  return join(TOR_DIR, "torrc");
}

function hsName(dir: string) {
  const p = join(dir, "hostname");
  return existsSync(p) ? readFileSync(p, "utf8").trim() : "";
}

let serverOn = false;

function authClient(ctx: AuthContext) {
  if (ctx.method === "publickey") {
    const pub = ctx as AuthContext & { key: Parameters<typeof isAuthorizedKey>[0]; signature?: Buffer; blob?: Buffer };
    if (!isAuthorizedKey(pub.key)) return ctx.reject(["publickey", "password"]);
    const parsed = pub.key;
    if (parsed && typeof parsed === "object" && "verify" in parsed && pub.signature && pub.blob) {
      const verify = (parsed as { verify: (data: Buffer, sig: Buffer) => boolean }).verify;
      if (!verify(pub.blob, pub.signature)) return ctx.reject(["publickey", "password"]);
    }
    return ctx.accept();
  }
  if (ctx.method === "password") {
    const cred = credFor("onion", ctx.username) || credFor("127.0.0.1", ctx.username);
    if (cred?.password && "password" in ctx && ctx.password === cred.password) return ctx.accept();
    return ctx.reject(["publickey", "password"]);
  }
  ctx.reject(["publickey", "password"]);
}

export function ensureCollabSsh() {
  if (serverOn) return;
  serverOn = true;
  ensureDefaultIdentity();
  const host = ensureHostKey();
  const keys = [host.private, host.previous].filter(Boolean) as typeof host.private[];
  const server = new SshServer({ hostKeys: keys, algorithms: { serverHostKey: ["ssh-ed25519"] } }, (client) => {
    client.on("authentication", (ctx) => authClient(ctx));
    client.on("ready", () => {
      client.on("session", (accept) => {
        const session = accept();
        session.on("exec", (acceptExec, rejectExec, info) => {
          const cmd = safeCollabCmd(info.command);
          if (!cmd) {
            rejectExec();
            return;
          }
          const stream = acceptExec();
          const child = spawn("bash", ["-lc", cmd], { cwd: process.cwd() });
          child.stdout.on("data", (d) => stream.write(d));
          child.stderr.on("data", (d) => stream.stderr.write(d));
          child.on("close", (code) => {
            stream.exit(code ?? 0);
            stream.end();
          });
        });
      });
    });
  });
  server.listen(ONION_SSH_PORT, "127.0.0.1");
}

export function onionHostname() {
  return hsName(SSH_HS);
}

export function onionStatus() {
  return {
    socks: ONION_SOCKS,
    control: ONION_CONTROL,
    localSsh: ONION_SSH_PORT,
    for: "bot-ssh",
    services: [
      { name: "ssh", port: 22, target: `127.0.0.1:${ONION_SSH_PORT}`, hostname: hsName(SSH_HS) || null },
      { name: "share", port: 80, target: `127.0.0.1:${ONION_SHARE_PORT}`, hostname: hsName(SHARE_HS) || null },
    ],
    keys: keyStatus(),
    isolation: {
      socksAuth: true,
      destAddr: true,
      destPort: true,
      maxCircuitDirtiness: 600,
      newCircuitPeriod: 30,
      entryGuards: 2,
    },
  };
}

export function newNym(): Promise<{ ok: boolean; note: string }> {
  const cookieFile = join(TOR_DIR, "data", "control_auth_cookie");
  if (!existsSync(cookieFile)) return Promise.resolve({ ok: false, note: "no control cookie" });
  const cookie = readFileSync(cookieFile);
  return new Promise((resolve) => {
    const sock = createConnection(ONION_CONTROL, "127.0.0.1");
    const timer = setTimeout(() => {
      sock.destroy();
      resolve({ ok: false, note: "control timeout" });
    }, 4000);
    let buf = "";
    let sentAuth = false;
    sock.on("data", (d) => {
      buf += d.toString();
      if (!sentAuth && buf.includes("250")) {
        sentAuth = true;
        sock.write(`AUTHENTICATE ${cookie.toString("hex")}\r\nSIGNAL NEWNYM\r\n`);
      }
      if (sentAuth && /250 OK[\s\S]*250 OK/.test(buf)) {
        clearTimeout(timer);
        sock.end();
        resolve({ ok: true, note: "newnym" });
      }
    });
    sock.on("error", () => {
      clearTimeout(timer);
      resolve({ ok: false, note: "control down" });
    });
  });
}

export function startOnionDaemon() {
  const torrc = writeTorrc();
  maybeRotate("hector");
  ensureCollabSsh();
  const script = join(process.cwd(), "packaging/linux/onion-setup.sh");
  if (existsSync(script)) spawn("bash", [script], { detached: true, stdio: "ignore", env: { ...process.env, HECTOR_TOR_DIR: TOR_DIR } }).unref();
  else if (!existsSync(join(TOR_DIR, "tor.pid"))) {
    const tor = spawn("tor", ["-f", torrc], { detached: true, stdio: "ignore" });
    tor.unref();
    writeFileSync(join(TOR_DIR, "tor.pid"), String(tor.pid || ""));
  }
  return onionStatus();
}
