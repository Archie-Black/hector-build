import { beforeEach, describe, expect, it } from "vitest";
import { braid, ping, stereo, encode, wantsAether } from "./aether";
import { leftover, step, strand } from "./aether-tqc";
import { resetQ } from "./aether-learn";

describe("Spectral HX Aether", () => {
  beforeEach(() => resetQ());

  it("puts a source on the left into the left ear", () => {
    const left = stereo(encode(1, { az: Math.PI / 2, el: 0, r: 1 }));
    const right = stereo(encode(1, { az: -Math.PI / 2, el: 0, r: 1 }));
    const front = stereo(encode(1, { az: 0, el: 0, r: 1 }));
    expect(left.l).toBeGreaterThan(left.r);
    expect(right.r).toBeGreaterThan(right.l);
    expect(Math.abs(front.l - front.r)).toBeLessThan(1e-9);
    const far = stereo(encode(1, { az: 0, el: 0, r: 4 }));
    expect(Math.abs(far.l)).toBeLessThan(Math.abs(front.l));
    const p = ping({ az: 0.6, el: 0.1, r: 1.4 });
    expect(p.l.length).toBeGreaterThan(100);
    expect(braid({ az: 0, el: 0, r: 1 }, { az: 1, el: 0, r: 1 }).az).toBeGreaterThan(0);
    expect(wantsAether("open spatial audio")).toBe(true);
  });

  it("moves on a reduced braid, not a lerp", () => {
    const here = { az: 0.4, el: 0.1, r: 1 };
    expect(leftover(here, here)).toBe(0);
    expect(step(here, here).az).toBe(here.az);
    expect(strand(here).length).toBeGreaterThan(0);
    const hop = step(here, { az: 1.2, el: -0.2, r: 3 });
    expect(hop.az).not.toBe(1.2);
    expect(hop.az).toBeGreaterThan(here.az);
  });
});
