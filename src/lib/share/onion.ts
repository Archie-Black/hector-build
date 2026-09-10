import { createConnection, type Socket } from "node:net";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { Server as SshServer } from "ssh2";
import { credFor } from "./room.ts";
import { isOnionHost, safeCollabCmd } from "./wire.ts";

export const ONION_SOCKS = Number(process.env.HECTOR_TOR_SOCKS || 19050);
export const ONION_SSH_PORT = 2222;

const TOR_DIR = join(process.cwd(), "data", "tor");
const HS_DIR = join(TOR_DIR, "hector-ssh");
const HOST_KEY = join(TOR_DIR, "ssh-host.pem");

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

function hostKey() {
  mkdirSync(TOR_DIR, { recursive: true });
  if (!existsSync(HOST_KEY)) {
    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs1", format: "pem" },
      publicKeyEncoding: { type: "pkcs1", format: "pem" },
    });
    writeFileSync(HOST_KEY, pair.privateKey, { mode: 0o600 });
  }
  return readFileSync(HOST_KEY);
}

let serverOn = false;

export function ensureCollabSsh() {
  if (serverOn) return;
  serverOn = true;
  const server = new SshServer({ hostKeys: [hostKey()] }, (client) => {
    client.on("authentication", (ctx) => {
      if (ctx.method !== "password") return ctx.reject(["password"]);
      const cred = credFor("onion", ctx.username) || credFor("127.0.0.1", ctx.username);
      if (cred?.password && ctx.password === cred.password) return ctx.accept();
      ctx.reject(["password"]);
    });
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
  const p = join(HS_DIR, "hostname");
  if (!existsSync(p)) return "";
  return readFileSync(p, "utf8").trim();
}

export function onionStatus() {
  return {
    socks: ONION_SOCKS,
    localSsh: ONION_SSH_PORT,
    hostname: onionHostname() || null,
    for: "bot-ssh",
  };
}

export function startOnionDaemon() {
  mkdirSync(HS_DIR, { recursive: true });
  const script = join(process.cwd(), "packaging/linux/onion-setup.sh");
  if (!existsSync(script)) return onionStatus();
  spawn("bash", [script], { detached: true, stdio: "ignore" }).unref();
  ensureCollabSsh();
  return onionStatus();
}
