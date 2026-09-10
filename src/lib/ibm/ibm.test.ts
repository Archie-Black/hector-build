import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forgeCtx } from "./contextforge.ts";
import { modelScore } from "../ollama/rank.ts";

describe("IBM ContextForge + Granite", () => {
  it("accepts LAN and https forge origins, rejects junk", () => {
    assert.ok(forgeCtx({ url: "http://127.0.0.1:4444" }));
    assert.ok(forgeCtx({ url: "https://mcp.doomchat.ca" }));
    assert.equal(forgeCtx({ url: "" }), null);
    assert.equal(forgeCtx({ url: "http://169.254.1.1:4444" }), null);
  });

  it("ranks Granite 4.2 30b as an agent model", () => {
    assert.ok(modelScore("granite4.2:30b") > modelScore("llama3.2:3b"));
    assert.ok(modelScore("granite4.2:8b") > 0);
  });
});
