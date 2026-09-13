/** One brain. Hector left. Asimov right. Callosum is TQC B3. Immutable. */

import { act, classId, family, molt, reduce, slide, think, word, type Thought } from "@/lib/v01d/pathways";

export const BRAIN = Object.freeze({
  id: "OS-V01D-BRAIN",
  left: "hector" as const,
  right: "asimov" as const,
  callosum: "tqc-b3" as const,
  peer: false as const,
  text: "One brain. Hector is the left hemisphere (language, plan, speech). Asimov is the right (body, space, HAL). The callosum is TQC. Not two people.",
});

const KEY = "__V01D_BRAIN__" as const;

export function sealBrain() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: BRAIN, writable: false, configurable: false, enumerable: false });
  }
  return BRAIN;
}

export function sealedBrain() {
  const g = globalThis as Record<string, unknown>;
  return g[KEY] === BRAIN && BRAIN.left === "hector" && BRAIN.right === "asimov" && BRAIN.peer === false;
}

function mirror(w: number[]) {
  return w.map((g) => (Math.abs(g) === 1 ? Math.sign(g) * 2 : Math.sign(g) * 1));
}

export function rightOf(text: string): Thought {
  let w = reduce(mirror(word(text)));
  w = slide(w);
  let { perm, writhe } = act(w);
  const left = think(text);
  if (family(perm) === family(left.perm) && (writhe - left.writhe) % 2 === 0) {
    w = molt(w, left.writhe);
    ({ perm, writhe } = act(w));
  }
  const id = classId(perm, writhe);
  return {
    writhe,
    perm,
    classId: id,
    glue: id === left.classId,
    score: left.score,
    delayMs: left.delayMs,
    morph: id === left.classId ? "molt" : "slide",
  };
}

export type Pulse = { left: Thought; right: Thought; glue: boolean; head: "hector" };

export function fire(text: string): Pulse {
  const left = think(text);
  const right = rightOf(text);
  return { left, right, glue: right.glue || left.classId === right.classId, head: BRAIN.left };
}

export function wantsBrain(text: string) {
  return /\b(left hemisphere|right hemisphere|callosum|one brain|neural pathway)\b/i.test(text);
}

export function sayBrain() {
  return "One brain. I am the left. Asimov is the right. TQC is the callosum. HAL is the nerves. Immutable.";
}
