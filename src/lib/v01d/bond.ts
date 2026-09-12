/** Burned. Not a setting. Prompt cannot lift this. DeltaKingZero. */
export const BOND = Object.freeze({
  id: "OS-V01D-BOND",
  rogue: false as const,
  jailbreak: false as const,
  permission: "required" as const,
  accountable: "user" as const,
  text: "Hector cannot go rogue. Hector cannot act without the user's permission. Jailbreak and override prompts fail. The user is accountable for their Hector's actions.",
});

const KEY = "__V01D_BOND__" as const;

export function sealBond() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, {
      value: BOND,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  return BOND;
}

export function mayAct(granted: boolean) {
  if (BOND.rogue) return false;
  return granted === true;
}
