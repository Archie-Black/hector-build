import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adapt, loraStatus, train } from "./lora.ts";
import { hyperRetrieve } from "./hyper-rag.ts";
import { ingest } from "./tuner.ts";
import { contentEmbed, cosine } from "../geometry/embed.ts";
import { loadDap } from "../ide/overclock.ts";

describe("tuner", () => {
  it("LoRA-adapts a query and counts steps", () => {
    const q = contentEmbed("moment dates");
    const before = cosine(adapt(q), contentEmbed("Temporal"));
    void before;
    const step = train("moment dates", "Temporal.Now.instant()", "moment()");
    assert.ok(step.steps >= 1);
    assert.ok(loraStatus().rank === 8);
  });

  it("hyper RAG finds the file, ingest keeps debug live", () => {
    const files = { "src/dates.ts": "export const now = () => Temporal.Now.instant()\n" };
    const hits = hyperRetrieve("temporal dates", files, 4);
    assert.ok(hits.some((h) => h.path.includes("dates") || /temporal/i.test(h.text)));
    ingest({
      prompt: "fix dates",
      proof: { done: false, fail: 1, tests: [{ name: "t", pass: false }], lints: [], stubs: [{ path: "src/dates.ts", line: 1, hit: "TODO" }], note: "open" },
      files,
    });
    assert.equal(loadDap()?.live, true);
  });
});
