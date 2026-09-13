import { describe, expect, it } from "vitest";
import { ISAAC } from "./isaac";
import { drive, openLab, permit, pulse, STACK } from "./lab";
import { resetMetal } from "@/lib/hector/metal";

describe("Asimov 01", () => {
  it("unifies ROS, Gazebo, OpenCV, Isaac 6.1 and will not move without you", () => {
    resetMetal();
    expect(STACK.rdna.role).toMatch(/counterpart to CUDA/);
    expect(ISAAC.version).toBe("6.1.0");
    const lab = openLab();
    const no = drive(lab, 1, 0);
    expect(no.ok).toBe(false);
    expect(no.law).toBe(2);
    permit(lab, true);
    pulse(lab, 0.1);
    expect(lab.bus.last["/odom"]).toBeTruthy();
    expect(lab.bus.last["/imu"]).toBeTruthy();
    expect(lab.bus.last["/hal/step"]).toBeTruthy();
    expect(lab.bus.last["/rl/policy"]).toBeTruthy();
    expect(lab.hal.step?.family).toBe("compute");
    expect(lab.edges.px.length).toBeGreaterThan(0);
  });

  it("stops before a person", () => {
    const lab = openLab();
    permit(lab, true);
    lab.world.bot.x = 10.2;
    lab.world.bot.y = 5;
    lab.world.bot.th = 0;
    const g = drive(lab, 1.2, 0);
    expect(g.ok).toBe(false);
    expect(g.law).toBe(1);
  });
});
