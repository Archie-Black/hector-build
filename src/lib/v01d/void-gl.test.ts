import { describe, expect, it } from "vitest";
import { ease, FRAG, VERT } from "./void-gl";
import { mixQ, resetQ, tune } from "./void-gl-learn";
import { frame } from "./void";
import { resetRl } from "@/lib/hector/rl";

describe("void field gl", () => {
  it("settles look on a braid and keeps the same uniforms as Godot/UE", () => {
    const a = ease({ x: 0, y: 0 }, { x: 10, y: 0 });
    expect(a.x).toBeGreaterThan(0);
    expect(a.x).toBeLessThan(10);
    expect(FRAG).toMatch(/u_look/);
    expect(VERT).toMatch(/a/);
    resetQ();
    const slow = tune(28);
    expect(slow).toBeLessThan(1);
    resetQ();
    tune(8);
    expect(mixQ()).toBeGreaterThan(0.9);
    resetRl();
    expect(frame(7).family).toBe("compute");
  });
});
