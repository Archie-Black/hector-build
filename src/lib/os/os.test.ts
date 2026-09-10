import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { boot, osStatus, ramPath, SERVICES, wipe } from "./kernel.ts";

describe("transient os", () => {
  it("Hector is kernel, Spectral HX is userland", () => {
    const hx = SERVICES.find((s) => s.id === "hx");
    const hector = SERVICES.find((s) => s.id === "hector");
    assert.equal(hector?.role, "kernel");
    assert.equal(hx?.role, "user");
  });

  it("boot is live and wipe forgets RAM", () => {
    const s = boot();
    assert.equal(s.phase, "live");
    const scratch = ramPath("scratch.txt");
    writeFileSync(scratch, "temp");
    assert.equal(existsSync(scratch), true);
    wipe();
    assert.equal(existsSync(scratch), false);
    assert.equal(osStatus().session.phase, "down");
  });
});
