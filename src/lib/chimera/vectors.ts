import { Enclave } from "./enclave.ts";
import { chaff, hopPort, jitterMs, padToBucket, unpad } from "./morph.ts";
import { trap } from "./honey.ts";

export type Vector = "rest" | "ws" | "grpc" | "rf";

export const VECTORS: Vector[] = ["rest", "ws", "grpc", "rf"];

export async function wrap(enc: Enclave, vec: Vector, payload: Uint8Array) {
  const sealed = await enc.seal(payload);
  const body = padToBucket(sealed.ct);
  return {
    v: 1,
    vec,
    epoch: enc.epoch(),
    hop: hopPort(enc.epoch()),
    iv: sealed.iv,
    tag: sealed.tag,
    body,
    chaff: vec === "rf" || vec === "ws" ? chaff(2) : [],
    wait: jitterMs(),
  };
}

export async function unwrap(enc: Enclave, vec: Vector, wire: { iv: Uint8Array; tag: string; body: Uint8Array }) {
  const ct = unpad(wire.body);
  const plain = await enc.open({ iv: wire.iv, ct, tag: wire.tag });
  if (!plain) {
    const t = await trap(vec, wire.tag);
    return { ok: false as const, decoy: t.decoy };
  }
  return { ok: true as const, plain };
}
