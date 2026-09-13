import { describe, expect, it } from "vitest";
import { parseComposePs, planRepair, summarize } from "./repair";

const ps = `{"Name":"osv01d-v01d-1","Service":"v01d","State":"running","Health":"healthy"}
{"Name":"osv01d-traefik-1","Service":"traefik","State":"running","Health":"unhealthy","RestartCount":0}
{"Name":"osv01d-timescale-1","Service":"timescale","State":"exited","Health":"","RestartCount":1}`;

describe("docker repair", () => {
  it("parses compose ps json lines", () => {
    const rows = parseComposePs(ps);
    expect(rows).toHaveLength(3);
    expect(rows[0].service).toBe("v01d");
    expect(rows[1].health).toBe("unhealthy");
  });

  it("restarts the proxy, does not wipe the database", () => {
    const steps = planRepair(parseComposePs(ps));
    expect(steps.find((s) => s.service === "traefik")?.action).toBe("restart");
    expect(steps.find((s) => s.service === "timescale")?.action).toBe("restart");
    expect(steps.some((s) => s.service === "timescale" && s.action === "recreate")).toBe(false);
    expect(steps.findIndex((s) => s.service === "timescale")).toBeLessThan(steps.findIndex((s) => s.service === "traefik"));
  });

  it("recreates a stuck app after two restarts", () => {
    const steps = planRepair([
      { name: "osv01d-v01d-1", service: "v01d", state: "exited", health: "none", restarts: 2 },
      { name: "osv01d-timescale-1", service: "timescale", state: "running", health: "healthy", restarts: 0 },
      { name: "osv01d-traefik-1", service: "traefik", state: "running", health: "healthy", restarts: 0 },
    ]);
    expect(steps.find((s) => s.service === "v01d")).toMatchObject({ action: "recreate" });
  });

  it("brings the stack up when nothing is running", () => {
    expect(planRepair([])[0].action).toBe("up");
    expect(summarize(planRepair([]))).toMatch(/Repair/);
    expect(summarize([])).toMatch(/All website services are up/);
  });
});
