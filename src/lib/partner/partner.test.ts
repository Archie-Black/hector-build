import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { impactOf, importGraph, prSpec, styleOf } from "./partner.ts";

describe("engineering partner", () => {
  it("maps architecture impact across imports", () => {
    const files = {
      "src/a.ts": `import { b } from "./b"\nexport const a = b\n`,
      "src/b.ts": `export const b = 1\n`,
    };
    const g = importGraph(files);
    assert.ok(g.length >= 1);
    const hit = impactOf("src/b.ts", files);
    assert.ok(hit.includes("src/a.ts"));
  });

  it("names a PR and reads team style", () => {
    const pr = prSpec("Add OAuth login", [{ path: "src/auth.ts" }]);
    assert.match(pr.branch, /^hx\//);
    const style = styleOf({ "src/a.ts": "const x = 'hi';\n" });
    assert.equal(style.quotes, "single");
  });
});
