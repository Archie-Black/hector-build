/** Spectral Handler. What launchers do — named ours. Not a copy. */
export const SEATS = [
  "Play",
  "Library",
  "Store",
  "Friends",
  "Forge",
  "Queue",
  "Vault",
  "Pulse",
] as const;

export type Seat = (typeof SEATS)[number];

export type Game = {
  name: string;
  note: string;
  icon: string;
  engine: "godot" | "ue" | "both";
};

export const GAMES: Game[] = [
  { name: "Spectral Horizon", note: "Moon royale", icon: "/horsemen/icons/portal.png", engine: "both" },
  { name: "Ghost Kart: Warzone", note: "Carnage", icon: "/horsemen/icons/ghostkart.png", engine: "both" },
  { name: "Ghost Maze", note: "Bones", icon: "/horsemen/hector-ask.png", engine: "godot" },
  { name: "Range", note: "Practice", icon: "/horsemen/icons/security.png", engine: "godot" },
];

export type Skin = {
  plate: string;
  lag: string;
  tilt: string;
  drip: string;
  gap: string;
  fall: string;
};

export const SKIN: Record<Seat, Skin> = {
  Play: { plate: "/horsemen/portal/keys/play.jpg", lag: "0s", tilt: "10deg", drip: "#ff4a12", gap: "11px", fall: "2.1s" },
  Library: { plate: "/horsemen/portal/keys/library.jpg", lag: "0.4s", tilt: "14deg", drip: "#5a2208", gap: "17px", fall: "3.4s" },
  Store: { plate: "/horsemen/portal/keys/store.jpg", lag: "0.9s", tilt: "18deg", drip: "#e6ff2a", gap: "7px", fall: "2.8s" },
  Friends: { plate: "/horsemen/portal/keys/friends.jpg", lag: "1.2s", tilt: "8deg", drip: "#7ec8ff", gap: "13px", fall: "4.1s" },
  Forge: { plate: "/horsemen/portal/keys/forge.jpg", lag: "0.2s", tilt: "22deg", drip: "#c9a227", gap: "9px", fall: "1.7s" },
  Queue: { plate: "/horsemen/portal/keys/queue.jpg", lag: "1.6s", tilt: "16deg", drip: "#0047ab", gap: "15px", fall: "3.8s" },
  Vault: { plate: "/horsemen/portal/keys/vault.jpg", lag: "0.7s", tilt: "12deg", drip: "#d6e86a", gap: "22px", fall: "5.2s" },
  Pulse: { plate: "/horsemen/portal/keys/pulse.jpg", lag: "0.1s", tilt: "26deg", drip: "#39f0ff", gap: "5px", fall: "1.3s" },
};

export function nextOf(list: Game[], cur: Game, dir: 1 | -1): Game {
  const i = list.findIndex((g) => g.name === cur.name);
  const n = list.length || 1;
  return list[(i + dir + n * 8) % n] ?? list[0]!;
}
