import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enumerate, hidPolicy, plug } from "./bus.ts";
import { enqueueJob, holdDevice, startDevice } from "./print.ts";
import { advertise, isPaired, pair, unpair } from "./sdp.ts";

describe("device bus", () => {
  it("HID never takes focus", () => {
    assert.equal(hidPolicy(), true);
    assert.ok(enumerate().some((d) => d.path === "/dev/hector/spool"));
  });

  it("holds a job until the device is back, like a print spooler", () => {
    holdDevice("model");
    const job = enqueueJob({ device: "model", title: "warm model" });
    assert.equal(job.state, "held");
    const drained = startDevice("model");
    assert.ok(drained.some((j) => j.id === job.id));
    plug("model", true);
  });

  it("pairs a bot once then remembers the bond", () => {
    const bond = pair("grok-build", "Grok Build", advertise().services);
    assert.equal(isPaired("grok-build"), true);
    assert.ok(bond.services.some((s) => s.uuid === "hx.tty"));
    unpair("grok-build");
    assert.equal(isPaired("grok-build"), false);
  });
});
