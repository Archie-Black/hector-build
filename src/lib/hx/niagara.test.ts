import { describe, expect, it } from "vitest";
import { boot, publish, step } from "./niagara";

describe("niagara", () => {
  it("one channel, play is a burst not a spawn storm", () => {
    let c = boot();
    c = step(c, 10);
    c = publish(c, { kind: "play", x: 0.5, heat: 1 });
    expect(c.burst).toBe(1);
    expect(c.heat).toBe(1);
    c = step(c, 11);
    expect(c.q.length).toBeLessThan(64);
    expect(c.burst).toBeLessThan(1);
  });
});
