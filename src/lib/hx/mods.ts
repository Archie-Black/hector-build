/** Community mods. Spectre only. No cash. */

export type Mod = {
  id: string;
  name: string;
  by: string;
  kind: "skin" | "map" | "trail" | "hat" | "livery";
  cost: number;
  icon: string;
  note: string;
};

export const MODS: Mod[] = [
  { id: "fedora", name: "Chrome Fedora", by: "DeltaKingZero", kind: "hat", cost: 400, icon: "/horsemen/hat-fedora.png", note: "Hector's lid. Community. Free to earn." },
  { id: "jersey", name: "Ghost Jersey", by: "crew", kind: "skin", cost: 250, icon: "/horsemen/hector-ask.png", note: "Number on the sheet. Yours." },
  { id: "trail", name: "Uranium Wake", by: "forge", kind: "trail", cost: 600, icon: "/horsemen/icons/handler.png", note: "Cobalt and yellow. No pay wall." },
  { id: "livery", name: "Warzone Livery", by: "kart", kind: "livery", cost: 800, icon: "/horsemen/icons/ghostkart.png", note: "Skull on the nose. Earned." },
  { id: "crater", name: "Phobos Crater", by: "horizon", kind: "map", cost: 1200, icon: "/horsemen/icons/portal.png", note: "Moon chunk. Play together." },
  { id: "toque", name: "Night Toque", by: "crew", kind: "hat", cost: 180, icon: "/horsemen/hat-toque.png", note: "Cold. Honest." },
];
