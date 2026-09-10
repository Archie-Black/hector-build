import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cssAspect, retinaOf } from "./retina.ts";
import { isSwitchChord, mapKey } from "./keymap.ts";
import { machAlloc, machBoot, machMakeSendOnce, machPass, machPortSet, machRecv, machRecvSet, machSend, machSendName, machSpaces, machVmAllocate, taskForPid } from "./mach.ts";
import { launchctlLoad, listJobs } from "./launchd.ts";
import { kvmBoot, kvmGrab, kvmKey, kvmSwitch } from "./seats.ts";
import { darwinBoot, sysctl, wantsDarwin } from "./darwin.ts";
import { frame } from "./webconnect.ts";

describe("hector kvm + darwin", () => {
  it("Cinema 30 is 2560×1600 16:10 with 2× backing", () => {
    const m = retinaOf("cinema30");
    assert.equal(m.physical.w, 2560);
    assert.equal(m.physical.h, 1600);
    assert.equal(m.logical.w, 1280);
    assert.equal(m.scale, 2);
    assert.equal(m.ratio, "16:10");
    assert.equal(cssAspect(m), "1280 / 800");
  });

  it("maps PC Control to Mac Command", () => {
    const hid = mapKey("pc", "mac", {
      code: "ControlLeft",
      key: "Control",
      ctrl: true,
      alt: false,
      meta: false,
      shift: false,
    });
    assert.equal(hid.meta, true);
    assert.equal(hid.ctrl, false);
    assert.equal(isSwitchChord({ code: "Backslash", key: "\\", ctrl: true, alt: false, meta: false, shift: true }, "pc"), true);
  });

  it("Mach rights reject a stolen knot", () => {
    const p = machAlloc("com.test.port", "hx");
    const bad = machSend("com.test.port", "stranger", "hello", "deadbeef");
    assert.equal("error" in bad, true);
    const ok = machSend("com.test.port", "hx", "hello", p.knot);
    assert.equal("error" in ok, false);
    const msg = machRecv("com.test.port", "hx");
    assert.equal("error" in msg, false);
  });

  it("ipc_space is local, send-once dies, receive moves, host-priv gates task_for_pid", () => {
    machBoot();
    machAlloc("com.test.once", "hx");
    machMakeSendOnce("com.test.once", "hx");
    const so = machSpaces().find((s) => s.task === "hx")?.rights.find((r) => r.kind === "send-once");
    assert.ok(so);
    assert.equal("error" in machSendName("hx", so.name, "one"), false);
    assert.equal("error" in machSendName("hx", so.name, "two"), true);

    machAlloc("com.test.move", "hx");
    const passed = machPass("hx", "com.spectralhx.seat", "com.test.move", "move-receive", "take it");
    assert.equal("error" in passed, false);
    assert.equal("error" in machRecv("com.test.move", "hx"), true);
    assert.equal("error" in machRecv("com.spectralhx.seat", "hx"), false);

    assert.equal("error" in taskForPid("hx", "hector"), true);
    const tfp = taskForPid("hector", "hx");
    assert.equal("error" in tfp, false);

    const set = machPortSet("hector", ["com.hector.host", "com.hector.host-priv"]);
    assert.ok(set.members && set.members.length >= 1);
    machSend("com.hector.host", "hector", "ping");
    const fromSet = machRecvSet("hector", set.name);
    assert.equal("error" in fromSet, false);

    const mem = machVmAllocate("hx", 8192);
    assert.equal("error" in mem, false);
    const spaces = machSpaces();
    assert.ok(spaces.some((s) => s.task === "hx" && s.special.taskSelf > 0));
  });

  it("launchd boots webconnect and kvm", () => {
    launchctlLoad();
    const labels = listJobs().map((j) => j.label);
    assert.ok(labels.includes("com.hector.webconnect"));
    assert.ok(labels.includes("com.hector.kvm"));
    assert.ok(labels.includes("com.spectralhx.seat"));
  });

  it("cycles host → darwin → hx and agents yield to a human grab", () => {
    kvmBoot("cinema30");
    assert.equal(kvmSwitch("darwin").active, "darwin");
    kvmGrab("you", "human", "darwin", true);
    const shadow = kvmGrab("hx", "agent", "darwin");
    assert.match(String(shadow.note ?? ""), /shadow/i);
    const sw = kvmKey({ code: "Backslash", key: "\\", ctrl: true, alt: false, meta: false, shift: true }, "pc");
    assert.ok("active" in sw);
  });

  it("sysctl speaks Darwin 25 and webconnect frames the seat", () => {
    const boot = darwinBoot("cinema30");
    assert.equal(sysctl("kern.ostype")["kern.ostype"], "Darwin");
    assert.equal(boot.release, "25.0.0");
    const f = frame();
    assert.equal(f.scene.retina.physical.w, 2560);
    assert.equal(f.port, 6081);
    assert.equal(wantsDarwin("spin up a Darwin sandbox on the Cinema Display"), true);
    assert.equal(wantsDarwin("rename a function"), false);
  });
});
