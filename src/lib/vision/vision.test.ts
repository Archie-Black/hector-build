import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { disparity, volumeOf } from "./stereo.ts";
import { anomaly, blockFlow } from "./flow.ts";
import { benchFrame, dualFrame, ptzTo, describeFrame } from "./camera.ts";
import { inspectUi, mockupToCode } from "./inspect.ts";
import { embodiedTick, wantsBody, resetBaseline } from "./body.ts";
import { onvifUrl } from "./onvif.ts";

describe("vision body", () => {
  it("measures stereo depth on the bench", () => {
    const { left, right } = dualFrame({ led: "green" });
    const map = disparity(left, right, 8, 3);
    const scene = describeFrame(left);
    assert.equal(scene.led, "green");
    assert.ok(volumeOf(map, scene.hot.x, scene.hot.y) >= 0);
  });

  it("flags a loose wire as anomaly", () => {
    resetBaseline();
    const base = benchFrame({ loose: false, led: "green" });
    const now = benchFrame({ loose: true, led: "red" });
    const d = anomaly(base, now, 20);
    assert.equal(d.hit, true);
    const flow = blockFlow(base, now);
    assert.ok(flow.length >= 0);
  });

  it("PTZ records a virtual pose", async () => {
    const m = await ptzTo(0.7, 0.3, 0.5);
    assert.equal(m.ok, true);
    assert.ok(m.pose.zoom > 0);
  });

  it("mockup becomes html+css and inspect finds bugs", () => {
    const files = mockupToCode("Ghost maze HUD", {});
    assert.ok(files["index.html"]?.includes("Ghost maze HUD"));
    const bugs = inspectUi({ "a.html": "<html><img src=x>" });
    assert.ok(bugs.bugs.length >= 1);
  });

  it("embodied tick returns a look", async () => {
    const t = await embodiedTick({}, { loose: true, led: "red" });
    assert.equal(t.rider, "body");
    assert.ok(t.look.text.length > 10);
    assert.equal(wantsBody("check the arduino LED on the workbench camera"), true);
    assert.equal(wantsBody("rename a function"), false);
  });

  it("ONVIF url defaults to PTZ path", () => {
    assert.match(onvifUrl("11.0.0.9") ?? "", /onvif\/PTZ/);
    assert.equal(onvifUrl(""), null);
  });
});
