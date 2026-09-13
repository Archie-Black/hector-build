import { describe, expect, it } from "vitest";
import { SQUAD, SEATS, SQUADS, drop, laneOf, matchmake, partyLane } from "./match";

function crowd(lane: "rookie" | "field" | "apex", n = SEATS): ReturnType<typeof base>[] {
  const mmr = lane === "rookie" ? 200 : lane === "field" ? 1400 : 2400;
  return Array.from({ length: n }, (_, i) => ({ id: `${lane}-${i}`, name: `${lane}${i}`, mmr: mmr + (i % 40) }));
}

function base(p: { id: string; name: string; mmr: number }) {
  return p;
}

describe("match", () => {
  it("caps a squad at six", () => {
    const q = crowd("field", 20);
    q[0]!.party = "a";
    q[1]!.party = "a";
    q[2]!.party = "a";
    q[3]!.party = "a";
    q[4]!.party = "a";
    q[5]!.party = "a";
    q[6]!.party = "a";
    const L = matchmake(q)!;
    expect(L.teams.every((t) => t.seats.length <= SQUAD)).toBe(true);
  });

  it("never drops a noob into apex or an elite into rookie", () => {
    expect(laneOf(0)).toBe("rookie");
    expect(laneOf(2500)).toBe("apex");
    expect(partyLane([{ id: "e", name: "e", mmr: 2500, party: "x" }, { id: "n", name: "n", mmr: 100, party: "x" }])).toBe("apex");
    const mixed = matchmake(crowd("rookie").concat(crowd("apex")))!;
    expect(mixed.full).toBe(true);
    expect(mixed.lane).toBe("apex");
    expect(mixed.teams.flatMap((t) => t.seats).every((p) => p.mmr >= 2000)).toBe(true);
    const apex = matchmake(crowd("apex"))!;
    expect(apex.full).toBe(true);
    expect(apex.teams.flatMap((t) => t.seats).every((p) => p.mmr >= 2000)).toBe(true);
    expect(drop(apex)).toBe(true);
    expect(apex.teams).toHaveLength(SQUADS);
  });

  it("will not drop a short lobby", () => {
    const L = matchmake(crowd("field", 12));
    expect(L?.full).toBe(false);
    expect(drop(L!)).toBe(false);
  });
});
