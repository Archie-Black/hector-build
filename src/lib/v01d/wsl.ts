/** Arch WSL. Always installed. Always available. The desk name can change. The room cannot. */

import { face, type Profile } from "./comfort";

export const DISTRO = "OSV01D";

export type Room = {
  name: string;
  distro: string;
  installed: true;
  systemd: true;
  bind: string;
  wine: true;
  helix: true;
  ghostwalk: true;
  pacman: true;
  note: string;
};

export function room(p: Profile | null): Room {
  const f = p
    ? face(p)
    : { linux: "Linux room", jargon: false, start: "Start", files: "This PC", programs: "Programs", terminal: false };
  return {
    name: f.linux,
    distro: DISTRO,
    installed: true,
    systemd: true,
    bind: "This PC is /mnt/c. Same files.",
    wine: true,
    helix: true,
    ghostwalk: true,
    pacman: true,
    note: f.jargon
      ? "Arch Linux in WSL2. systemd, rolling pacman, Wine, Helix, GhostWalk. Default distro OSV01D."
      : "Linux room is installed and ready. Same files as Windows. You do not have to type.",
  };
}

export function wantsRoom(text: string) {
  return /\b(linux room|open (the )?arch|start wsl|\bwsl\b|osv01d room)\b/i.test(text);
}
