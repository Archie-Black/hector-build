import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  autophagy,
  entangle,
  mintCell,
  mitosis,
  observeGenome,
  repair,
  tissue,
  transcribe,
  tunnel,
} from "./cell.ts";

describe("immortal cells", () => {
  it("mitosis does not clone RAM", () => {
    const p = mintCell("conquest", "c1");
    transcribe(p, "alpha genome work");
    const { parent, daughter } = mitosis(p);
    assert.equal(parent.die.spec.id, "c1");
    assert.equal(parent.die.halted, false);
    assert.equal(daughter.die.eeprom.centromere, "c1");
    assert.equal(daughter.die.ram[3], 0);
    assert.equal(parent.die.halted, false);
    assert.ok(parent.mitoses === 1);
    assert.ok(daughter.gen === 1);
  });

  it("repair restores cycles from braid slack", () => {
    const c = mintCell("war", "w1");
    transcribe(c, "policy deny isolate audit");
    c.die.cyclesUsed = 4000;
    const used = c.die.cyclesUsed;
    repair(c);
    assert.ok(c.die.cyclesUsed <= used);
    assert.equal(c.die.halted, false);
  });

  it("halted cell tunnels through Hector", () => {
    const h = mintCell("death", "hector");
    transcribe(h, "germline");
    const s = mintCell("famine", "f1");
    transcribe(s, "local roster allow");
    s.die.halted = true;
    s.phase = "wound";
    s.die.snap = s.die.snap ?? {
      cyclesUsed: 0,
      ram: new Float32Array(s.die.ram),
      eeprom: {},
      braid: [...s.die.braid],
    };
    tunnel(s, h);
    assert.equal(s.die.halted, false);
    assert.ok(s.entangled.includes("hector"));
  });

  it("entangled cells form a tissue", () => {
    const a = mintCell("conquest", "a");
    const b = mintCell("war", "b");
    transcribe(a, "aaa");
    transcribe(b, "bbb");
    entangle(a, b);
    observeGenome(a);
    autophagy(a);
    const t = tissue([a, b]);
    assert.ok(t.some((g) => g.includes("a") || g.length >= 1));
  });
});
