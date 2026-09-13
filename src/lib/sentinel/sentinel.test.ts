import { beforeEach, describe, expect, it } from "vitest";
import { cosine, embed } from "./embed";
import { consolidate, recall, remember, resetMemory, working } from "./memory";
import { dispatch } from "./swarm";
import { dream } from "./dream";
import { mark, resetKpis, snapshot, degraded } from "./kpis";
import { resetMutate } from "./mutate";
import { resetBus } from "./broker";
import { poke } from "./soma";
import { resetPath } from "@/lib/v01d/pathways";

describe("eternal sentinel", () => {
  beforeEach(() => {
    resetMemory();
    resetKpis();
    resetMutate();
    resetBus();
    resetPath();
    poke();
  });

  it("embeds locally and recalls what it just stored", () => {
    const a = embed("website copies");
    expect(a).toHaveLength(32);
    expect(cosine(a, a)).toBeCloseTo(1, 5);
    remember({ id: "1", text: "scale the website", at: 1, who: "user" });
    consolidate(working()[0]);
    expect(recall("website scale")[0].text).toMatch(/website/i);
  });

  it("sends deep work to beta and refusals to alpha", () => {
    expect(dispatch("refactor the whole repository architecture").agent).toBe("beta");
    expect(dispatch("break into the school network").say).toMatch(/no/i);
  });

  it("dreams once, then holds while the user is busy", () => {
    remember({ id: "2", text: "backup the website", at: 2, who: "user" });
    const first = dream();
    expect(first.ran).toBe(true);
    poke();
    const second = dream();
    expect(second.ran).toBe(false);
  });

  it("flags degraded alignment", () => {
    const prev = mark(40, 10, 100, 0.9, false);
    resetKpis();
    for (let i = 0; i < 10; i++) mark(40, 10, 100, 0.2, false);
    expect(degraded(prev, snapshot())).toBe(true);
  });
});
