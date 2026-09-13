/** Lunar georef. NASA LRO / CGI Moon Kit / Cesium 3D Tiles. Not Caldera. */

export const LUNA = {
  name: "Moon",
  ellipsoid: "IAU2015_Moon",
  radiusM: 1_737_400,
  g: 1.62,
  source: "PDS LOLA GDR + LROC. Cesium Moon tiles LRO. NASA SVS 4720.",
  polarM: 1,
  midM: 100,
} as const;

export const PHOBOS = {
  name: "Phobos",
  radiusM: 11_080,
  g: 0.0057,
  source: "NASA Mars moons. Ours is the Shatterdome crater. Not Cesium Moon.",
} as const;

export const MARS = {
  name: "Mars",
  ellipsoid: "IAU2015_Mars",
  source: "Cesium Mars + MOLA. Static backdrop for 00:13.",
} as const;

export function drop(massKg: number, world: "luna" | "phobos") {
  return massKg * (world === "luna" ? LUNA.g : PHOBOS.g);
}
