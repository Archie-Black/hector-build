import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIAG } from "./diagnose";
import { allow, diplomat, firewall, split, which } from "./cores";

describe("dual core", () => {
  it("sends ffmpeg to the machine and walls the diplomat off exec", () => {
    expect(which("ffmpeg -i a.wav b.mp3")).toBe("machine");
    expect(allow("ffmpeg -i a.wav b.mp3")).toBe("ffmpeg");
    expect(split("ffmpeg -i a.wav b.mp3").delayMs).toBe(0);
    expect(which("thanks for keeping this clean")).toBe("diplomat");
    const d = diplomat("hey thanks");
    expect(d.tone).toBe("collaborative");
    const walled = firewall({ say: "hi", run: "ffmpeg" }, "diplomat", "hey");
    expect(walled.run).toBeUndefined();
    expect(firewall({ say: "ok", run: "fabric-heal" }, "diplomat", "restart the website").run).toBe("fabric-heal");
  });

  it("ships one Service block without RR that would fail the unit", () => {
    const unit = readFileSync("/workspace/packaging/arch/dual-core/osv01d-cores.service", "utf8");
    expect(unit.split("[Service]")).toHaveLength(2);
    expect(unit).not.toMatch(/CPUSchedulingPolicy/);
    expect(unit).toMatch(/Nice=-20/);
    expect(unit).toMatch(/LimitRTPRIO=99/);
    expect(DIAG.some((c) => c.includes("systemd-analyze verify"))).toBe(true);
  });
});
