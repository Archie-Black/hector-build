/** Burned into OS V01D. Not a setting. DeltaKingZero. */
export const LAW = Object.freeze({
  id: "OS-V01D-LAW-UNIQUE",
  by: "DeltaKingZero",
  copies: false as const,
  needGrant: true as const,
  eachOriginal: true as const,
  text: "Do not copy to save time. Full genuine unique generations only. Permission is per task, in the user's words. If two things match, keep one original and make the other new.",
});

export const UNIQUE = LAW;

const KEY = "__V01D_LAW__" as const;

export function burn() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, {
      value: LAW,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  return LAW;
}

export function sealed() {
  const g = globalThis as Record<string, unknown>;
  return g[KEY] === LAW && LAW.copies === false;
}

export function mayReuse(grant: string | undefined) {
  if (!grant) return false;
  return /keep this|only change|permission/i.test(grant);
}
