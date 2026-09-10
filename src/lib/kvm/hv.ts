import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { retinaOf, type RetinaMode } from "./retina.ts";

export type Accel = "kvm" | "hvf" | "whpx" | "tcg";

export function detectAccel(): Accel {
  const plat = typeof process !== "undefined" ? process.platform : "linux";
  if (plat === "darwin") return "hvf";
  if (plat === "win32") return "whpx";
  if (existsSync("/dev/kvm")) return "kvm";
  return "tcg";
}

export function qemuBin() {
  const root = process.cwd();
  const names = [
    join(root, "runtime/qemu/qemu-system-x86_64"),
    "/usr/bin/qemu-system-x86_64",
    "/usr/local/bin/qemu-system-x86_64",
    "/opt/homebrew/bin/qemu-system-x86_64",
  ];
  return names.find((p) => existsSync(p)) || "qemu-system-x86_64";
}

export function darwinIso() {
  const root = process.cwd();
  const names = [
    join(root, "packaging/darwin/darwin.iso"),
    join(root, "packaging/darwin/puredarwin.iso"),
    join(root, "packaging/guest/alpine-virt-x86_64.iso"),
  ];
  return names.find((p) => existsSync(p)) || "";
}

export function qemuArgs(mode: RetinaMode = retinaOf()) {
  const accel = detectAccel();
  const iso = darwinIso();
  const args = [
    "-machine",
    `q35,accel=${accel}:tcg`,
    "-m",
    process.env.HECTOR_DARWIN_MEM || "2048",
    "-smp",
    process.env.HECTOR_DARWIN_CPUS || "2",
    "-name",
    "hector-darwin",
    "-device",
    `virtio-vga,edid=on,xres=${mode.physical.w},yres=${mode.physical.h}`,
    "-usb",
    "-device",
    "usb-kbd",
    "-device",
    "usb-tablet",
    "-audiodev",
    "none,id=a0",
    "-nic",
    "user,model=virtio-net-pci,hostfwd=tcp:127.0.0.1:2223-:22,hostfwd=tcp:127.0.0.1:6081-:6081",
    "-vnc",
    "127.0.0.1:1,websocket=5701",
    "-daemonize",
    "-pidfile",
    join(process.cwd(), "data/kvm/darwin.pid"),
  ];
  if (iso) args.push("-cdrom", iso, "-boot", "d");
  return { accel, iso, bin: qemuBin(), args, mode };
}

export function spawnDarwin() {
  const spec = qemuArgs();
  if (!existsSync(spec.bin)) {
    return { ...spec, live: false, note: "QEMU missing — compositor live" };
  }
  try {
    spawn(spec.bin, spec.args, { detached: true, stdio: "ignore", cwd: process.cwd() }).unref();
    return { ...spec, live: true, note: spec.iso ? "darwin guest" : "retina seat (no Darwin ISO)" };
  } catch {
    return { ...spec, live: false, note: "QEMU spawn failed — compositor still live" };
  }
}
