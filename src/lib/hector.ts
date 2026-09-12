/** Hector talks Chimera. Same envelope as the bot. */
import { Enclave, wrap, type Vector } from "@/lib/chimera";

const enc = new Enclave(new Uint8Array(32).fill(3));

export async function hectorHop(vec: Vector, payload: string) {
  return wrap(enc, vec, new TextEncoder().encode(payload));
}

export function hectorEpoch() {
  return enc.epoch();
}

export { LAW, UNIQUE, burn, sealed, mayReuse } from "@/lib/hector/unique";
