import { createConnection, type Socket } from "node:net";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import ssh2 from "ssh2";
import type { AuthContext } from "ssh2";

const SshServer = ssh2.Server;
import { credFor } from "./room.ts";
import { isOnionHost, safeCollabCmd } from "./wire.ts";
import { ensureDefaultIdentity, ensureHostKey, isAuthorizedKey, keyStatus } from "./keys.ts";

export const ONION_SOCKS = Number(process.env.HECTOR_TOR_SOCKS || 19050);
export const ONION_CONTROL = Number(process.env.HECTOR_TOR_CONTROL || 19051);
export const ONION_SSH_PORT = 2222;
export const ONION_SHARE_PORT = Number(process.env.PORT || 8080);

const TOR_DIR = join(process.cwd(), "data", "tor");
const SSH_HS = join(TOR_DIR, "hector-ssh");
const SHARE_HS = join(TOR_DIR, "hector-share");

export { isOnionHost };

export function socksConnect(destHost: string, destPort: number, socksPort = ONION_SOCKS): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const sock = createConnection(socksPort, "127.0.0.1");
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error("onion socks timeout"));
    }, 25000);
    let phase: "auth" | "reply" = "auth";
    sock.once("connect", () => sock.write(Buffer.from([0x05, 0x01, 0x00])));
    sock.on("data", (buf) => {
      if (phase === "auth") {
        if (buf.length < 2 || buf[1] !== 0) {
          clearTimeout(timer);
          sock.destroy();
          reject(new Error("onion socks auth"));
          return;
        }
        const host = Buffer.from(destHost);
        const req = Buffer.concat([
          Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]),
          host,
          Buffer.from([(destPort >> 8) & 0xff, destPort & 0xff]),
        ]);
        phase = "reply";
        sock.write(req);
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
SocksPort 127.0.0.1:${ONION_SOCKS} IsolateDestAddr IsolateSOCKSAuth IsolateClientProtocol
ControlPort 127.0.0.1:${ONION_CONTROL}
CookieAuthentication 1
CookieAuthFile ${join(TOR_DIR, "data", "control_auth_cookie")}
AvoidDiskWrites 1
SafeLogging 1
LongLivedPorts 22
HiddenServiceDir ${SSH_HS}
HiddenServiceVersion 3
HiddenServicePort 22 127.0.0.1:${ONION_SSH_PORT}
HiddenServiceMaxStreams 32
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
  const server = new SshServer({ hostKeys: [host.private], algorithms: { serverHostKey: ["ssh-ed25519"] } }, (client) => {
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
  };
}

export function startOnionDaemon() {
  const torrc = writeTorrc();
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
