import { describe, expect, it } from "vitest";
import { boot, step, TITLE } from "./ghostkart";

describe("ghostkart", () => {
  it("holds a tape and a scream band", () => {
    let k = boot();
    for (let i = 0; i < 60; i++) k = step(k, 1, 0.2, 1 / 60, i === 40);
    expect(TITLE).toMatch(/Warzone/);
    expect(k.tape.length).toBe(60);
    expect(k.rpm).toBeGreaterThan(800);
    expect(k.hp).toBeLessThan(100);
  });
});
