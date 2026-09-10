import { scene, kvmPointer, kvmKey, kvmGrab, type SeatId } from "./seats.ts";
import type { HidKey } from "./keymap.ts";
import { webconnectPort } from "./launchd.ts";

export function webconnectCfg() {
  return {
    protocol: "hector-rfb/1",
    bind: "127.0.0.1",
    port: webconnectPort(),
    path: "/kvm/darwin",
    retina: scene().retina,
    note: "Same-origin frame. NoVNC not required.",
  };
}

export function frame() {
  return { ...webconnectCfg(), scene: scene() };
}

export function input(body: {
  op?: string;
  x?: number;
  y?: number;
  key?: HidKey;
  who?: string;
  seat?: SeatId;
}) {
  const op = body.op ?? "pointer";
  if (op === "grab") return kvmGrab(String(body.who ?? "human"), "human", body.seat);
  if (op === "key" && body.key) return kvmKey(body.key);
  if (op === "pointer") return { cursor: kvmPointer(Number(body.x ?? 0.5), Number(body.y ?? 0.5), body.seat) };
  return frame();
}
