import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isWslJob, winToWsl, wslStatus } from "./wsl.ts";
import { safeAptName, HECTOR_BASE_PKGS } from "./apt.ts";

describe("embedded WSL", () => {
  it("maps NTFS to the WSL mount", () => {
    assert.equal(winToWsl("C:\\Users\\dkz\\hector-build"), "/mnt/c/Users/dkz/hector-build");
    assert.equal(winToWsl("D:/src/app"), "/mnt/d/src/app");
  });

  it("only allowlists jobs", () => {
    assert.equal(isWslJob("embed"), true);
    assert.equal(isWslJob("packages"), true);
    assert.equal(isWslJob("rm"), false);
  });

  it("rejects shell metacharacters in package names", () => {
    assert.equal(safeAptName("git"), "git");
    assert.equal(safeAptName("python3-pip"), "python3-pip");
    assert.equal(safeAptName("git; rm -rf /"), null);
    assert.ok(HECTOR_BASE_PKGS.includes("nala"));
  });

  it("reports a live linux host as already ready", () => {
    const s = wslStatus();
    assert.equal(s.embedded, true);
    if (process.platform === "linux") {
      assert.equal(s.via, "native-linux");
      assert.equal(s.ready, true);
    }
  });
});
