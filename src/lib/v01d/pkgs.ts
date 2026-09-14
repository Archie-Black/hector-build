/** Official pacman names for every programs.ts bin that ships on Arch. */

export const PACMAN: Record<string, string> = {
  gimp: "gimp",
  darktable: "darktable",
  inkscape: "inkscape",
  krita: "krita",
  blender: "blender",
  kdenlive: "kdenlive",
  audacity: "audacity",
  ardour: "ardour",
  obs: "obs-studio",
  vlc: "vlc",
  wine: "wine-staging",
  notepad: "wine-staging",
  git: "git",
  node: "nodejs",
  npm: "npm",
  python: "python",
  ffmpeg: "ffmpeg",
  foot: "foot",
  tor: "tor",
  helix: "helix",
  office: "libreoffice-fresh",
  samba: "samba",
  docker: "docker",
  qemu: "qemu",
  godot: "godot",
  xonotic: "xonotic",
  opencv: "opencv",
};

/** Not in extra. packaging/suite and packaging/forge fetch these. */
export const FETCH = ["penpot", "comfyui", "unreal", "cardinal", "surge-xt", "vital"];

export function pacmanOf(bin: string) {
  return PACMAN[bin];
}

export function isFetched(bin: string) {
  return FETCH.includes(bin);
}
