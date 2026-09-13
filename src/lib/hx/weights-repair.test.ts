import { describe, expect, it } from "vitest";
import { energy, extrapolate, repair, rotten, split, stripes } from "./weights-repair";
import { mend } from "./weights-heal";

describe("weight geometry repair", () => {
  it("rebuilds one dead stripe from parity and refuses two holes as a model", () => {
    const buf = new Uint8Array(256);
    for (let i = 0; i < buf.length; i++) buf[i] = (i * 13 + 7) & 255;
    const one = repair(buf, { size: 64, n: 4, kill: [1] });
    expect(one.exact).toBe(true);
    expect([...one.buf]).toEqual([...buf]);
    expect(one.healed).toEqual([1]);
    const two = repair(buf, { size: 64, n: 4, kill: [0, 1] });
    expect(two.exact).toBe(false);
    expect(two.fail).toEqual([0, 1]);
    const m = mend(buf, [1]);
    expect(m.action).toBe("use");
    expect(mend(buf, [0, 1]).action).toBe("refetch");
  });

  it("marks a zeroed chunk as rotten by laplacian", () => {
    const buf = new Uint8Array(128);
    for (let i = 0; i < buf.length; i++) buf[i] = 180;
    const c = split(buf, 32);
    c[1] = new Uint8Array(32);
    expect(energy(c[0]!) > energy(c[1]!)).toBe(true);
    expect(rotten(c)).toContain(1);
    expect(stripes(split(buf, 32), 4).length).toBeGreaterThan(0);
    const g = extrapolate([c[0]!, null, c[2]!]);
    expect(g[1]!.length).toBe(32);
  });
});
