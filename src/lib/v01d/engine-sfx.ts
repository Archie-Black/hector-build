/** Desk look and SFX numbers live in Unreal + Godot. The web bus plays those numbers. */

export const ENGINE_SFX = Object.freeze({
  bed: 36.7,
  beat: 37.15,
  fifth: 55.1,
  air: 622,
  duck: 0.06,
  bell: [196, 147, 220, 164.8] as const,
  tick: 1240,
  pickA: 523.25,
  pickB: 784,
  hum: 62,
  whoosh: 420,
  godot: "native/horizon/Godot/void/score.gd",
  ue: "native/horizon/UE/VoidDesktop/Source/VoidScore.h",
});

export const ENGINE_FIELD = Object.freeze({
  hash: 43758.5453123,
  look: 0.016,
  voidc: [0.02, 0.02, 0.024] as const,
  cobalt: [0, 0.11, 0.42] as const,
  godot: "native/horizon/Godot/void/nebula.gdshader",
  ue: "native/horizon/UE/VoidDesktop/Shaders/VoidNebula.usf",
});

export const ENGINE_DRIP = Object.freeze({
  hash: 43758.5453,
  cobalt: [0, 0.18, 0.67] as const,
  uranium: [0.9, 1, 0.16] as const,
  lava: [1, 0.22, 0.04] as const,
  ue: "native/horizon/UE/SpectralHorizon/Shaders/MenuDrip.usf",
});
