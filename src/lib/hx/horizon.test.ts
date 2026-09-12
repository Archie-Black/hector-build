import { describe, expect, it } from "vitest";
import { boot, step } from "./horizon";

describe("horizon", () => {
  it("ticks a persistent world", () => {
    let w = boot();
    for (let i = 0; i < 120; i++) w = step(w);
    expect(w.tick).toBe(120);
    expect(w.inv).not.toBe(boot().inv);
  });
});
