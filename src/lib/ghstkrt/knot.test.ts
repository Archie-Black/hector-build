import { describe, expect, it } from "vitest";
import { unwrap, wrap } from "./knot";

describe("ghstkrt", () => {
  it("only Hector can read the blob", () => {
    const blob = wrap("ntfs>ext4:open");
    expect(unwrap(blob)).toBe("ntfs>ext4:open");
    blob[8] ^= 1;
    expect(unwrap(blob)).not.toBe("ntfs>ext4:open");
  });
});
