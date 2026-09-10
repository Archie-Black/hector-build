import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blockedAddr, NET_AGENTS, netctl, snapshot } from "./stack.ts";
import { tickNet } from "./heal.ts";

describe("netd", () => {
  it("netd reports to Hector, the rest to netd", () => {
    const netd = NET_AGENTS.find((a) => a.id === "netd");
    assert.equal(netd?.reports, "hector");
    assert.ok(NET_AGENTS.filter((a) => a.id !== "netd").every((a) => a.reports === "netd"));
  });

  it("never probes metadata or link-local", () => {
    assert.equal(blockedAddr("169.254.1.1"), true);
    assert.equal(blockedAddr("127.0.0.1"), false);
  });

  it("refuses non-stack binaries", async () => {
    assert.match(await netctl(["nmap", "scanme.nmap.org"]), /STUB/);
    assert.match(await netctl(["ip", "-br", "a; rm"]), /STUB|refused/);
  });

  it("tick reports to Hector", async () => {
    process.env.HECTOR_NET = "0";
    const out = await tickNet();
    assert.equal(out.object, "hector.net");
    assert.ok(out.reports.some((r) => r.to === "hector"));
    const snap = await snapshot();
    assert.ok(snap.links.length >= 1);
  });
});
