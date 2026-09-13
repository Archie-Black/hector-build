import { describe, expect, it } from "vitest";
import { beat, birth, CREDIT, DONE, HAWKING, MARK, opening, parked, slit, SPEECH, TRAVEL_AT, typed } from "./overture";

describe("Aliens overture", () => {
  it("pans Mars, types Hawking, and ends on Welcome to OS VOID", () => {
    expect(CREDIT).toBe("a deltakingzero build");
    expect(HAWKING).toMatch(/stars/);
    expect(SPEECH).toMatch(/Welcome to OS VOID/);
    expect(opening(0).black).toBeGreaterThan(0.7);
    expect(opening(16_000).done).toBe(false);
    expect(opening(20_000).credit).toBeGreaterThan(0);
    expect(opening(50_000).mars).toBeLessThan(opening(0).mars);
    expect(opening(40_000).top).toBeGreaterThan(45);
    expect(opening((TRAVEL_AT + 10) * 1000).top).toBeGreaterThan(70);
    expect(typed(44).length).toBe(0);
    expect(typed(60).length).toBeGreaterThan(40);
    expect(beat(4, 0)).not.toBe(beat(4, 1));
    expect(typed(90)).toMatch(/Welcome to OS VOID/);
    expect(birth(1).split).toBeGreaterThan(0.1);
    expect(slit(1).opacity).toBe(1);
    expect(MARK).toMatch(/logo-v01d/);
    expect(parked().top).toBeGreaterThan(85);
    expect(parked().scale).toBe(opening(DONE * 1000).scale);
  });
});
