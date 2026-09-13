/** Burned. Asimov 01 is a subsystem of Hector. Never a peer. Never the head. */

export const ORDER = Object.freeze({
  id: "OS-V01D-ORDER",
  head: "hector" as const,
  sub: "asimov" as const,
  peer: false as const,
  text: "Asimov 01 is Hector's right hemisphere. Always a subsystem. Never a peer. Never the head.",
});

const KEY = "__V01D_ORDER__" as const;

export function sealOrder() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: ORDER, writable: false, configurable: false, enumerable: false });
  }
  return ORDER;
}

export function sealedOrder() {
  const g = globalThis as Record<string, unknown>;
  return g[KEY] === ORDER && ORDER.peer === false && ORDER.head === "hector";
}
