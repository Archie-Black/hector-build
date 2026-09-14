/** OS V01D look and SFX come from Unreal + Godot. Palette stays sealed. */

export const LOOK = Object.freeze({
  vanta: "#050506",
  cobalt: "#0047ab",
  uranium: "#e6ff2a",
  godot: {
    desk: "native/horizon/Godot/void/project.godot",
    games: "native/horizon/Godot/project.godot",
    nebula: "native/horizon/Godot/void/nebula.gdshader",
    bin: "/opt/godot/Godot",
    pacman: "/usr/bin/godot",
    open: "native/horizon/scripts/open-void-godot.sh",
    warm: "native/horizon/scripts/warm-aesthetics.sh",
  },
  ue: {
    desk: "native/horizon/UE/VoidDesktop/VoidDesktop.uproject",
    games: "native/horizon/UE/SpectralHorizon/SpectralHorizon.uproject",
    nebula: "native/horizon/UE/VoidDesktop/Shaders/VoidNebula.usf",
    slit: "native/horizon/UE/VoidDesktop/Shaders/AliensSlit.usf",
    drip: "native/horizon/UE/SpectralHorizon/Shaders/MenuDrip.usf",
    sparks: "native/horizon/UE/SpectralHorizon/Shaders/NextGenSparks.usf",
    overture: "native/horizon/UE/VoidDesktop/Source/VoidOverture.cpp",
    bin: "/opt/unreal/Engine/Binaries/Linux/UnrealEditor",
    open: "native/horizon/scripts/open-void-unreal.sh",
    install: "packaging/arch/install-ue.sh",
  },
  sfx: {
    score: "src/lib/v01d/void-score.ts",
    overture: "native/horizon/UE/VoidDesktop/Source/VoidOverture.cpp",
    godot: "native/horizon/Godot",
    duck: 0.06,
  },
  field: "src/lib/v01d/void-gl.ts",
});

export function deskProjects() {
  return { godot: LOOK.godot.desk, ue: LOOK.ue.desk };
}

export function gameProjects() {
  return { godot: LOOK.godot.games, ue: LOOK.ue.games };
}

export function aestheticShaders() {
  return [LOOK.godot.nebula, LOOK.ue.nebula, LOOK.ue.slit, LOOK.ue.drip, LOOK.ue.sparks];
}

export function wantsEngines(text: string) {
  return /\b(godot|unreal editor|unreal 5|void desktop|open (the )?(editor|engines))\b/i.test(text);
}
