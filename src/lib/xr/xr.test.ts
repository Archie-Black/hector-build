import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickSession, probeXr, sessionInit, type XrCaps } from "./caps.ts";

const none: XrCaps = { xr: false, vr: false, ar: false, inline: false };
const headset: XrCaps = { xr: true, vr: true, ar: true, inline: true };
const arOnly: XrCaps = { xr: true, vr: false, ar: true, inline: true };

describe("webxr caps", () => {
  it("probe is closed when navigator.xr is missing", async () => {
    const caps = await probeXr();
    assert.equal(caps.vr, false);
    assert.equal(caps.ar, false);
  });

  it("glass never starts a session", () => {
    assert.equal(pickSession(headset, "glass"), null);
  });

  it("headset prefers VR, then AR", () => {
    assert.equal(pickSession(headset, "headset"), "immersive-vr");
    assert.equal(pickSession(arOnly, "headset"), "immersive-ar");
    assert.equal(pickSession(none, "headset"), null);
  });

  it("room uses inline when the UA has it", () => {
    assert.equal(pickSession(headset, "room"), "inline");
  });

  it("AR asks for hit-test and optional DOM overlay", () => {
    const root = { nodeType: 1 } as unknown as HTMLElement;
    const init = sessionInit("immersive-ar", root);
    assert.ok(init.optionalFeatures?.includes("hit-test"));
    assert.ok(init.optionalFeatures?.includes("dom-overlay"));
    assert.equal(init.domOverlay?.root, root);
  });

  it("VR asks for a floor", () => {
    const init = sessionInit("immersive-vr");
    assert.ok(init.optionalFeatures?.includes("local-floor"));
  });
});
