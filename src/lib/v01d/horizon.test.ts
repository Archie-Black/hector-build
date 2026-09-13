import { describe, expect, it } from "vitest";
import { get, put, resetDisk } from "./vfs-proto";
import { pack, pageFill, unpack } from "./horizon";
import { fits } from "@/lib/hx/density";
import { AHEAD, live, resetVfs, waste } from "@/lib/hector/vfs-learn";
import { of, resetProto } from "@/lib/hx/proto";

describe("horizon vfs", () => {
  it("runs two generations ahead, packs, learns, and comes back whole", () => {
    resetVfs();
    resetProto();
    resetDisk();
    const L = live();
    expect(L.gap).toBe(AHEAD);
    expect(L.run.gen).toBe(L.now + AHEAD);
    const src = new Uint8Array(4096 * 3 + 80);
    for (let i = 0; i < src.length; i++) src[i] = (i * 13) & 255;
    const t = pack(src);
    expect(t.gen).toBe(L.now + AHEAD);
    expect(unpack(t)).toEqual(src);
    expect(pageFill(t)).toBeGreaterThan(0.7);
    expect(waste(src.length, t.grain)).toBeLessThanOrEqual(waste(src.length, 4096));
    for (const c of t.store.values()) {
      if (c.data) expect(fits(c.data.length, c.r)).toBe(true);
    }
    put("/v01d/home/note.bin", src);
    expect(get("/v01d/home/note.bin")).toEqual(src);
    expect(of("horizon")?.hits).toBeGreaterThan(0);
    expect(live().run.gen).toBe(live().now + AHEAD);
  });
});
