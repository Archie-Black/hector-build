import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { speakDone, speakOnIt, speakScout } from "./speak.ts";

const hold = { done: true, fail: 0, tests: [], lints: [], stubs: [], note: "HOLD" };

describe("human voice", () => {
  it("sounds like a person, not a log", () => {
    assert.equal(speakOnIt("add a button"), "On it.");
    assert.match(speakDone({ written: ["src/a.ts"], proof: hold }), /^Done\./);
    assert.doesNotMatch(speakScout(3, 0), /Hector API|engine|prove/i);
  });
});
