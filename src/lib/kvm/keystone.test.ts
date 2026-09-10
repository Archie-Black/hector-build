import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALL_MAP, productionSpec, resolve, unresolved } from "./map.ts";
import { keystoneRun } from "./keystone.ts";

describe("keystone mac mapping", () => {
  it("resolves Mach rights, HID, glass, and production", () => {
    assert.equal(resolve("MACH_PORT_RIGHT_SEND_ONCE")?.to, "send-once");
    assert.equal(resolve("host_priv_t")?.to, "com.hector.host-priv");
    assert.equal(resolve("Control")?.to, "Command");
    assert.equal(resolve("Cinema Display 30″")?.to, "2560×1600");
    assert.equal(resolve("accel darwin")?.to, "hvf");
    assert.deepEqual(unresolved(["host_priv_t", "no-such-map"]), ["no-such-map"]);
    assert.ok(ALL_MAP.length >= 24);
    assert.equal(productionSpec().retina, "2560x1600");
    assert.equal(productionSpec().hostPriv, "hector");
  });

  it("Keystone leads a team and each agent gets several tasks", () => {
    const r = keystoneRun(["host_priv_t", "Control", "webconnect"]);
    assert.equal(r.lead, "keystone");
    assert.equal(r.agents.length, 6);
    for (const a of r.agents) {
      assert.ok(a.tasks.length >= 3, a.id);
    }
    assert.ok(r.done >= 18);
    assert.equal(r.blocked, 0);
    assert.equal(r.missing.length, 0);
    const hx = r.agents.find((a) => a.id === "prove")?.tasks.find((t) => t.title.includes("task_for_pid"));
    assert.equal(hx?.result, "HX denied");
    assert.ok(r.wrote.some((p) => p.endsWith("production.json")));
  });
});
