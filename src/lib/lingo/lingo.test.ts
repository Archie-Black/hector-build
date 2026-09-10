import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parse, stripJargon } from "./syntax.ts";
import { aware, improve, learn, render } from "./lingua.ts";

describe("lingua", () => {
  it("parses syntax and strips machine talk", () => {
    const s = parse("Hey, can you add a button?");
    assert.equal(s.register, "casual");
    assert.equal(s.clauses[0]?.kind, "question");
    assert.doesNotMatch(stripJargon("Hector API applied 3 files. Prove HOLD."), /Hector API|Prove/i);
  });

  it("learns, speaks like a person, and knows itself", () => {
    learn("hey fix the login please");
    const said = render("Hector API applied src/login.ts on the local engine.", { who: "hector", job: "fix login" });
    assert.doesNotMatch(said, /Hector API|local engine/i);
    assert.match(said, /I |I'm |I'll |Done|put|login/i);
    const me = aware();
    assert.match(me.i, /Lingua/);
    const v = improve();
    assert.ok(v.sentenceLen > 0);
  });
});
