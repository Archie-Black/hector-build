import { describe, expect, it, beforeEach } from "vitest";
import { act, classId, molt, reduce, think, resetPath, word } from "./pathways";

describe("cognitive metamorphic pathways", () => {
  beforeEach(() => resetPath());

  it("same wording glues", () => {
    const a = think("restart the website");
    const b = think("restart the website");
    expect(b.glue).toBe(true);
    expect(a.classId).toBe(b.classId);
  });

  it("cancels inverse crossings and keeps the permutation", () => {
    const w = [1, -1, 2];
    const r = reduce(w);
    expect(r).toEqual([2]);
    expect(act(r).perm.sort()).toEqual([0, 1, 2]);
  });

  it("molt changes writhe by two without scrambling strands", () => {
    const w = word("scale the website");
    const before = act(w);
    const m = molt(w, before.writhe + 2);
    const after = act(m);
    expect(after.perm).toEqual(before.perm);
    expect(after.writhe).toBe(before.writhe + 2);
  });

  it("think always names a morph", () => {
    const t = think("backup the website");
    expect(["keep", "reduce", "slide", "molt"]).toContain(t.morph);
    expect(t.delayMs).toBeGreaterThan(0);
    expect(classId(t.perm, t.writhe)).toBe(t.classId);
  });
});
