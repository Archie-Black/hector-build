import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DIAG } from "./diagnose";
import { allow, diplomat, firewall, split, which } from "./cores";

const UNIT_REL = "packaging/arch/dual-core/osv01d-cores.service";

function unitPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../..", UNIT_REL);
}

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
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    expect(src).toContain(UNIT_REL);
    const unitFile = unitPath();
    expect(existsSync(unitFile)).toBe(true);
    const unit = readFileSync(unitFile, "utf8");
    expect(unit.split("[Service]")).toHaveLength(2);
    expect(unit).not.toMatch(/CPUSchedulingPolicy/);
    expect(unit).toMatch(/Nice=-20/);
    expect(unit).toMatch(/LimitRTPRIO=99/);
    expect(DIAG.some((c) => c.includes("systemd-analyze verify"))).toBe(true);
  });
});
