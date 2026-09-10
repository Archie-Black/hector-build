import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveEngine } from "./engines.ts";

describe("engines", () => {
  it("stays on Hector when nothing local is up and no paid key", async () => {
    const e = await resolveEngine({ providerId: "hector", baseUrl: "/api/v1", model: "hector-hx", key: "" });
    assert.equal(e.kind, "hector-local");
  });

  it("uses a paid key only when the user chose that provider", async () => {
    const e = await resolveEngine({
      providerId: "xai",
      baseUrl: "https://api.x.ai/v1",
      model: "grok-4.5",
      key: "xai-test-key-12345",
    });
    assert.equal(e.kind, "cloud");
    assert.ok(e.baseUrl.includes("x.ai"));
  });
});
