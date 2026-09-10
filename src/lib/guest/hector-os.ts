import { createServerFn } from "@tanstack/react-start";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { osStatus } from "../os/kernel.ts";

const SCRIPT = join(process.cwd(), "packaging/guest/hector-guest.sh");
const ISO = join(process.cwd(), "packaging/guest/alpine-virt-x86_64.iso");
const BUNDLED = join(process.cwd(), "runtime/qemu/qemu-system-x86_64");

function run(args: string[]): Promise<string> {
  return new Promise((resolve) => {
    if (!existsSync(SCRIPT)) {
      resolve("STUB: guest script missing");
      return;
    }
    const child = spawn("bash", [SCRIPT, ...args], { cwd: process.cwd() });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (d: Buffer) => chunks.push(d));
    child.stderr.on("data", (d: Buffer) => chunks.push(d));
    child.on("error", () => resolve("STUB: cannot spawn guest ctl"));
    child.on("exit", () => resolve(Buffer.concat(chunks).toString("utf8").trim()));
  });
}

export const guestStatus = createServerFn({ method: "GET" }).handler(async () => {
  const qemu =
    existsSync(BUNDLED) ||
    existsSync("/usr/bin/qemu-system-x86_64") ||
    existsSync("/usr/local/bin/qemu-system-x86_64");
  const out = await run(["status"]);
  const os = osStatus();
  return {
    qemu,
    iso: existsSync(ISO),
    kvm: existsSync("/dev/kvm"),
    text: out,
    live: out.startsWith("LIVE") || os.session.phase === "live",
    os,
  };
});

export const guestStart = createServerFn({ method: "POST" }).handler(async () => {
  return { text: await run(["start"]) };
});

export const guestStop = createServerFn({ method: "POST" }).handler(async () => {
  return { text: await run(["stop"]) };
});

export const guestWipe = createServerFn({ method: "POST" }).handler(async () => {
  return { text: await run(["wipe"]) };
});

export const guestSnapshot = createServerFn({ method: "POST" }).handler(async () => {
  return { text: await run(["snapshot"]) };
});

export const guestConsole = createServerFn({ method: "GET" }).handler(async () => {
  return { text: await run(["console"]) };
});
