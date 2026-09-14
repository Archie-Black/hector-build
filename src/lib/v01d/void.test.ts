import { describe, expect, it } from "vitest";
import { CREDIT, opening } from "./overture";
import { aim, carousel, lift, nearest, ring, VOID } from "./void";

describe("void desk", () => {
  it("keeps the old wallpaper and places icons on a ring", () => {
    expect(VOID.saved).toMatch(/field-dawn/);
    expect(VOID.wallpaper).toMatch(/void/);
    expect(VOID.ue).toMatch(/VoidDesktop/);
    expect(VOID.godot).toMatch(/Godot\/void/);
    const a = ring(8, 0, 0, 100);
    const b = ring(8, 4, 0, 100);
    expect(Math.round(a.x + b.x)).toBe(0);
    expect(Math.round(a.y + b.y)).toBe(0);
    expect(opening(0).black).toBeGreaterThan(0.7);
    expect(opening(14_000).done).toBe(false);
    expect(opening(80_000).done).toBe(false);
    expect(opening(90_000).done).toBe(true);
    expect(CREDIT).toMatch(/deltakingzero/);
    expect(opening(40_000).top).toBeGreaterThan(45);
  });

  it("brings the aimed icon to the front of the carousel", () => {
    const n = 8;
    expect(nearest(n, 0).i).toBe(0);
    expect(nearest(n, aim(n, 3)).i).toBe(3);
    const front = carousel(n, 0, 0, 100);
    const back = carousel(n, 4, 0, 100);
    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.z).toBeGreaterThan(back.z);
    expect(lift(front.scale, false, true)).toBe(front.scale);
    expect(lift(front.scale, true, true)).toBeGreaterThan(front.scale);
  });
});
