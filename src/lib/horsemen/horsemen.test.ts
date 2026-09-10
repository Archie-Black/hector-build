import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decidePolicy, DEFAULT_POLICY, evalCel, type PolicyCtx } from "./cel.ts";
import { askBot, hectorDelegate, routeWeb, superBotBrief } from "./unify.ts";
import { HECTOR_ID, lead } from "./roster.ts";

const ctx = (over: Partial<PolicyCtx> = {}): PolicyCtx => ({
  tool: { name: "read_file" },
  intent: "read",
  bot: { id: "death" },
  file: { path: "src/a.ts", name: "a.ts", extension: "ts" },
  ...over,
});

describe("horsemen", () => {
  it("hector is the leader", () => {
    assert.equal(lead().id, HECTOR_ID);
    assert.equal(lead().name, "Hector");
    assert.equal(superBotBrief().lead.id, "death");
  });

  it("fail-closed deny wins", () => {
    const d = decidePolicy(
      { deny: ['tool.name == "bash"'], allow: ["true"] },
      ctx({ tool: { name: "bash" } }),
    );
    assert.equal(d, "deny");
  });

  it("allows listed tools", () => {
    assert.equal(decidePolicy(DEFAULT_POLICY, ctx()), "allow");
  });

  it("broken rule denies", () => {
    assert.equal(evalCel("not a rule !!!", ctx()).ok, false);
    assert.equal(decidePolicy({ deny: ["%%%"], allow: ["true"] }, ctx()), "deny");
  });

  it("one hop only", () => {
    const first = askBot("death", "war", "isolate this", 0);
    assert.equal(first.from, "war");
    const chained = askBot("war", "famine", "again", 1);
    assert.equal(chained.lead, "death");
    assert.match(chained.text, /One hop/i);
  });

  it("hector delegates then folds", () => {
    const r = hectorDelegate("write an immutable audit policy");
    assert.equal(r.lead, "death");
    assert.equal(r.from, "war");
  });

  it("Punisher rides the surface, Dark Horse the onion", () => {
    assert.equal(routeWeb("https://doomchat.ca"), "punisher");
    assert.equal(routeWeb("http://abc.onion/"), "darkhorse");
    assert.ok(superBotBrief().web?.some((w) => w.id === "punisher"));
  });
});
