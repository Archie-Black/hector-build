import { describe, expect, it } from "vitest";
import { onFloor, pick, STREAMS, SUITE, vertical, wantsSuite } from "./suite";

describe("Genesis HX Suite", () => {
  it("covers the creative floors and cuts a vertical copy", () => {
    expect(SUITE.name).toMatch(/Genesis/);
    expect(pick("gimp")?.bin).toBe("gimp");
    expect(pick("metahuman")?.floor).toBe("world");
    expect(onFloor("forge").length).toBeGreaterThanOrEqual(4);
    expect(onFloor("photo").map((t) => t.id)).toEqual(["gimp", "darktable"]);
    expect(wantsSuite("open gimp")).toBe(true);
    expect(STREAMS[0]?.w).toBe(1920);
    const v = vertical("talk.mp4");
    expect(v[0]).toBe("ffmpeg");
    expect(v.join(" ")).toMatch(/1080:1920/);
  });
});
