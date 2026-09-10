/** Notorious Mac 16:10 glass. Physical pixels, 2× HiDPI backing. */

export type RetinaId = "cinema30" | "retina13" | "retina15" | "unibody";

export type RetinaMode = {
  id: RetinaId;
  name: string;
  physical: { w: number; h: number };
  logical: { w: number; h: number };
  scale: 2;
  ratio: "16:10";
  ppi: number;
};

export const RETINA: Record<RetinaId, RetinaMode> = {
  cinema30: {
    id: "cinema30",
    name: "Cinema Display 30″",
    physical: { w: 2560, h: 1600 },
    logical: { w: 1280, h: 800 },
    scale: 2,
    ratio: "16:10",
    ppi: 101,
  },
  retina13: {
    id: "retina13",
    name: "Retina 13″",
    physical: { w: 2560, h: 1600 },
    logical: { w: 1280, h: 800 },
    scale: 2,
    ratio: "16:10",
    ppi: 227,
  },
  retina15: {
    id: "retina15",
    name: "Retina 15″",
    physical: { w: 2880, h: 1800 },
    logical: { w: 1440, h: 900 },
    scale: 2,
    ratio: "16:10",
    ppi: 220,
  },
  unibody: {
    id: "unibody",
    name: "Unibody 13″",
    physical: { w: 1440, h: 900 },
    logical: { w: 1440, h: 900 },
    scale: 2,
    ratio: "16:10",
    ppi: 128,
  },
};

export const DEFAULT_RETINA: RetinaId = "cinema30";

export function retinaOf(id?: string): RetinaMode {
  if (id && id in RETINA) return RETINA[id as RetinaId];
  return RETINA[DEFAULT_RETINA];
}

export function qemuEdid(mode: RetinaMode) {
  return [`xres=${mode.physical.w}`, `yres=${mode.physical.h}`];
}

export function cssAspect(mode: RetinaMode) {
  return `${mode.logical.w} / ${mode.logical.h}`;
}
