import { describe, expect, it } from "vitest";
import { boot, die, grant, spawn, spend, survive, total, SPAWN } from "./spectre";
import { boot as round, finish } from "./royale";

describe("spectre", () => {
  it("never needs cash and keeps a survive", () => {
    let w = spawn(boot());
    expect(w.life).toBe(SPAWN);
    w = grant(w, 400, "play");
    const dead = die(w);
    expect(dead.drop).toBe(400);
    expect(dead.wallet.life).toBe(SPAWN);
    w = grant(spawn(boot()), 900, "build");
    w = survive(w)!;
    expect(total(w)).toBeGreaterThan(SPAWN);
    expect(spend(w, 9_999_999)).toBeNull();
  });

  it("hides the nuke until the sides are done", () => {
    const r = round();
    const nuke = r.missions.find((m) => m.secret)!;
    expect(finish(nuke, r).pay).toBe(0);
    let cur = r;
    for (const m of r.missions.filter((x) => !x.secret)) {
      const n = finish(m, cur);
      cur = n.round;
    }
    expect(finish(nuke, cur).pay).toBe(2000);
  });
});
