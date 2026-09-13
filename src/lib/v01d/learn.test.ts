import { beforeEach, describe, expect, it } from "vitest";
import { blank, key, remember, resetLearn, tick, weight } from "./learn";
import type { Row } from "./repair";

const row = (service: string, health: Row["health"]): Row => ({
  name: service,
  service,
  state: "running",
  health,
  restarts: 0,
});

describe("ops graph learning", () => {
  beforeEach(() => resetLearn());
  it("cannot unlearn the database-to-website edge", () => {
    let b = blank();
    const downDb: Row[] = [row("timescale", "unhealthy"), row("v01d", "healthy"), row("traefik", "healthy")];
    const downSite: Row[] = [row("timescale", "healthy"), row("v01d", "unhealthy"), row("traefik", "healthy")];
    b = tick(b, downDb);
    for (let i = 0; i < 40; i++) b = tick(b, i % 2 ? downSite : downDb);
    expect(weight(b, "timescale", "v01d")).toBeGreaterThanOrEqual(0.8);
  });

  it("raises the edge when two services fall together", () => {
    let b = blank();
    const up = [row("timescale", "healthy"), row("v01d", "healthy"), row("traefik", "healthy")];
    const both = [row("timescale", "unhealthy"), row("v01d", "unhealthy"), row("traefik", "healthy")];
    b = tick(b, up);
    for (let i = 0; i < 12; i++) b = tick(b, i % 2 ? both : up);
    expect(weight(b, "timescale", "v01d")).toBeGreaterThan(1);
  });

  it("keeps a live mind across ticks", () => {
    resetLearn();
    remember([row("v01d", "healthy"), row("timescale", "healthy")]);
    const b = remember([row("v01d", "unhealthy"), row("timescale", "healthy")]);
    expect(b.ticks).toBe(2);
    expect(key("v01d", "timescale")).toBe("timescale|v01d");
  });
});
