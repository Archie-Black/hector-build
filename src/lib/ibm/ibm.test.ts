import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { forgeCtx, forgeHealth, LOCAL_FORGE } from "./contextforge.ts";
import { modelScore } from "../ollama/rank.ts";

describe("IBM ContextForge + Granite", () => {
  it("is always on — empty defaults to IBM :4444, junk falls back to Hector", () => {
    assert.equal(forgeCtx({ url: "" }).via, "ibm");
    assert.equal(forgeCtx({ url: "" }).origin, "http://127.0.0.1:4444");
    assert.equal(forgeCtx({ url: "http://169.254.1.1:4444" }).via, "hector");
    assert.equal(forgeCtx({ url: "https://mcp.doomchat.ca" }).via, "ibm");
    assert.equal(LOCAL_FORGE.alwaysOn, true);
  });

  it("local health is healthy without IBM running", async () => {
    const h = (await forgeHealth(LOCAL_FORGE)) as { status: string; alwaysOn: boolean };
    assert.equal(h.status, "healthy");
    assert.equal(h.alwaysOn, true);
  });

  it("ranks Granite 4.2 30b as an agent model", () => {
    assert.ok(modelScore("granite4.2:30b") > modelScore("llama3.2:3b"));
    assert.ok(modelScore("granite4.2:8b") > 0);
  });
});
