import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { scanPaths } from "./hook-scan.mjs";

const dir = join(process.cwd(), "data", "tmp-hook-scan");

describe("git hook scan", () => {
  it("blocks env names and xAI keys, allows ordinary source", () => {
    mkdirSync(dir, { recursive: true });
    const ok = join(dir, "ok.ts");
    const bad = join(dir, "leak.ts");
    writeFileSync(ok, 'export const n = 1;\n');
    writeFileSync(bad, 'const k = "xai-' + "A".repeat(40) + '";\n');
    assert.equal(scanPaths([ok]).length, 0);
    assert.ok(scanPaths([bad]).length >= 1);
    assert.ok(scanPaths([".env"]).some((h) => h.why === "blocked name"));
    rmSync(dir, { recursive: true, force: true });
  });
});
