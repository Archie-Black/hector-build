import { Enclave } from "./enclave.ts";
import { Riv } from "./riv.ts";
import { STACKS } from "./stacks.ts";
import { VECTORS } from "./vectors.ts";
import { trapsSince } from "./honey.ts";
import { hopPort } from "./morph.ts";

export * from "./ct.ts";
export * from "./enclave.ts";
export * from "./riv.ts";
export * from "./morph.ts";
export * from "./honey.ts";
export * from "./vectors.ts";
export * from "./stacks.ts";

export function status(enc: Enclave, riv: Riv) {
  return {
    object: "hector.chimera",
    horse: "defense",
    epoch: enc.epoch(),
    hop: hopPort(enc.epoch()),
    stacks: STACKS,
    vectors: VECTORS,
    riv: riv.root() ? "pinned" : "empty",
    traps: trapsSince(4),
    note: "Assume the OS is hostile. Secrets stay sealed. Observers get chaff.",
  };
}
