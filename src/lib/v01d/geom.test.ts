import { beforeEach, describe, expect, it } from "vitest";
import { braidHealth, calm, curvature, farthestCopy, field, heat, laplacian, predictFail, repairRank, tqcOp } from "./geom";
import { resetLearn } from "./learn";
import type { Row } from "./repair";

const row = (service: string, health: Row["health"], state: Row["state"] = "running", restarts = 0): Row => ({
  name: `osv01d-${service}-1`,
  service,
  state,
  health,
  restarts,
});

describe("service graph geometry", () => {
  beforeEach(() => resetLearn());
  it("repairs the database before the website if both are down", () => {
    const rows = [row("v01d", "unhealthy"), row("timescale", "unhealthy"), row("traefik", "healthy")];
    expect(repairRank("timescale", rows)).toBeLessThan(repairRank("v01d", rows));
  });

  it("is not calm when the website is down", () => {
    const down = [row("v01d", "unhealthy"), row("timescale", "healthy"), row("traefik", "healthy")];
    expect(calm(down)).toBe(false);
    const up = [row("v01d", "healthy"), row("timescale", "healthy"), row("traefik", "healthy")];
    expect(calm(up)).toBe(true);
    expect(curvature(field(up))).toBeLessThan(0.45);
  });

  it("retires the copy farthest from the healthy cluster", () => {
    const copies: Row[] = [
      { name: "good", service: "v01d", state: "running", health: "healthy", restarts: 0 },
      { name: "flaky", service: "v01d", state: "running", health: "unhealthy", restarts: 4 },
    ];
    expect(farthestCopy(copies)).toBe("flaky");
  });

  it("gives a failed node next to healthy ones a positive laplacian", () => {
    const rows = [row("v01d", "unhealthy"), row("timescale", "healthy"), row("traefik", "healthy")];
    expect(laplacian("v01d", field(rows))).toBeGreaterThan(0);
    expect(predictFail(rows)).toBe("v01d");
    expect(tqcOp(rows).next).toBe("v01d");
    expect(tqcOp(rows).delayMs).toBeGreaterThan(0);
    expect(braidHealth([row("v01d", "healthy")])).toBeGreaterThan(braidHealth([row("v01d", "unhealthy", "running", 4)]));
    const h1 = heat(field(rows));
    expect(h1.v01d).toBeGreaterThan(0);
  });
});
