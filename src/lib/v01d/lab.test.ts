import { describe, expect, it } from "vitest";
import { VFS_GRANT } from "./grant";
import { evolve, find, pin } from "./lab";
import { say } from "./talk";

describe("vfs lab", () => {
  it("is already granted", () => {
    expect(VFS_GRANT.limit).toBe("none");
    expect(VFS_GRANT.ask).toBe(false);
  });
  it("builds the next tongues", () => {
    const r = evolve();
    expect(r.built).toContain("virtiofs");
    expect(say("/home/a", "ext4", "virtiofs")).toContain("home");
    const id = pin("/v01d/home/Documents");
    expect(find(id)).toBe("/v01d/home/Documents");
  });
});
