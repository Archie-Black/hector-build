/** What must be signed. No dummy keys. Unsigned firmware never flashes. */

export const SIGN = Object.freeze({
  id: "OS-V01D-SIGN",
  by: "DeltaKingZero",
  text: "Firmware: LVFS only. Packages: gpg. Units: sha256 + gpg. Weights: sha256. No key in git.",
});

export type Kind = "firmware" | "package" | "units" | "weights";
export type Gate = "ok" | "refuse" | "skip";

export function may(kind: Kind, signed: boolean, hashOk = true): Gate {
  if (kind === "firmware") return signed ? "ok" : "refuse";
  if (kind === "package") return signed && hashOk ? "ok" : "refuse";
  if (kind === "units") return signed && hashOk ? "ok" : "refuse";
  if (kind === "weights") return signed && hashOk ? "ok" : "skip";
  return "refuse";
}

export function wantsSign(text: string) {
  return /\b(sign(ed|ature)?|gpg|lvfs capsule|package sig)\b/i.test(text);
}

export function saySign() {
  return SIGN.text + " makepkg --sign. osv01d-sign. Unsigned BIOS does not install.";
}
