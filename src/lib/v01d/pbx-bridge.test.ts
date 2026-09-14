import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARTER } from "./charter";
import { hxExecCmd, hxExecLaunch, taskOf } from "./hx-exec";
import { PBX, pbxJob, sayPbx, wantsPbx } from "./pbx-bridge";
import { findProg } from "./programs";

describe("hyper pbx", () => {
  it("unifies Spectral HX with VSCodium on the vscodium-swarm", () => {
    expect(PBX.face).toBe("Spectral HX");
    expect(PBX.editor).toBe("VSCodium");
    expect(PBX.swarm).toBe("vscodium-swarm");
    expect(PBX.exec).toBe("hx-exec");
    expect(PBX.downloads).toBe(CHARTER.downloads);
    expect(wantsPbx("open hyper pbx")).toBe(true);
    expect(wantsPbx("open pbx console")).toBe(true);
    expect(wantsPbx("open pbx")).toBe(true);
    expect(sayPbx()).toMatch(/hx-exec/);
    expect(pbxJob("refactor the repository").lane).toBe("codium");
    expect(pbxJob("raise 40 agents").lane).toBe("swarm");
    expect(findProg("pbx")?.name).toBe("PBX Console");
    expect(findProg("codium")?.linux).toMatch(/codium/);
    const launch = hxExecLaunch({ folder: "/v01d/hx", task: "typecheck" });
    expect(launch.swarm).toBe("vscodium-swarm");
    expect(launch.args[0]).toBe("/v01d/hx");
    expect(launch.args).toContain("--new-window");
    expect(launch.task).toBe("Typecheck");
    expect(taskOf("build")?.cmd).toMatch(/npm run build/);
    expect(hxExecCmd({ folder: "." })[1]).toBe(PBX.script);
    const script = readFileSync("packaging/hx/hx-exec.sh", "utf8");
    expect(script).toContain("codium");
    expect(script).toContain("vscodium-swarm");
  });
});
