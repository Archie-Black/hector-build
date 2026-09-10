import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeIsa, mintDie, dieStatus, eepromWrite } from "./die.ts";
import { couple, residueOf } from "./substrate.ts";
import { orchestrate } from "./orchestrate.ts";

describe("agent chips", () => {
  it("each die has cpu ram eeprom of its own", () => {
    const a = mintDie("conquest");
    const b = mintDie("war");
    executeIsa(a, "search the maze");
    executeIsa(b, "deny the shell");
    assert.notEqual(a.jones, b.jones);
    assert.equal(a.eeprom === b.eeprom, false);
    assert.ok(dieStatus(a).cpu.used > 0);
    assert.ok(dieStatus(a).eeprom.cap > dieStatus(b).eeprom.cap || true);
  });

  it("eeprom is capped like a bank chip", () => {
    const d = mintDie("spawn");
    d.spec.eepromBytes = 40;
    eepromWrite(d, "a.txt", "tiny");
    assert.throws(() => eepromWrite(d, "b.txt", "x".repeat(80)));
  });

  it("coupling peaks on a path neither die ranked first", () => {
    const a = mintDie("conquest");
    const b = mintDie("war");
    executeIsa(a, "alpha");
    executeIsa(b, "beta");
    const ra = residueOf(a, [
      { path: "src/a.ts", amp: 0.9 },
      { path: "src/shared.ts", amp: 0.2 },
    ]);
    const rb = residueOf(b, [
      { path: "src/b.ts", amp: 0.85 },
      { path: "src/shared.ts", amp: 0.25 },
    ]);
    const e = couple([ra, rb]);
    assert.equal(e[0].path, "src/shared.ts");
    assert.match(e[0].why, /beat|collapse/i);
    assert.ok(e[0].parents.length >= 2);
  });

  it("dies carry Jones and determinant", () => {
    const d = mintDie("conquest");
    executeIsa(d, "trefoil braid work");
    const s = dieStatus(d);
    assert.ok(s.jones.length >= 1);
    assert.ok(s.det >= 1);
  });

  it("hector leads the orchestra", () => {
    const files = {
      "src/a.ts": "export const a = 1",
      "src/b.ts": "export const b = 2",
      "src/test.ts": "test(a)",
    };
    const o = orchestrate("add a test for a", files);
    assert.equal(o.lead, "death");
    assert.equal(o.chips.length, 4);
    assert.equal(o.chips[0].die.kind, "death");
    assert.equal(o.brief, "");
  });
});
