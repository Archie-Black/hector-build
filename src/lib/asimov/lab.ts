/** Asimov 01. ROS 2, Gazebo, OpenCV. HAL queues. Hector RL. One lab. */

import { bus, on, pub, tickClock, topics, type Bus } from "./graph";
import { gate, LAWS, type Gate } from "./laws";
import { camera, step, world, type World } from "./sim";
import { blur, gray, sobel, track } from "./vision";
import type { Imu } from "./physx";
import { ISAAC } from "./isaac";
import { RDNA } from "./rdna";
import { crew, type Crew, type Seat } from "./team";
import { inhabit, type House } from "./home";
import { chorus, wire } from "./mouth";
import { watch } from "@/lib/hector/metal";
import { sayRl } from "@/lib/hector/rl";
import { HAL, submit, type Backend, type Op } from "@/lib/v01d/hal";

export const STACK = Object.freeze({
  rdna: { name: `${RDNA.name} ${RDNA.version}`, role: `ROCm counterpart to CUDA. They work as a team. ${RDNA.gfx} + HIP.` },
  hal: { name: HAL.name, role: "One command list. RDNA, CUDA, Vulkan. Hector binds the queue." },
  ros: { name: "ROS 2", role: "Nerves. Nodes, topics, clock." },
  gazebo: { name: "Gazebo", role: "Open floor if you want Classic." },
  isaac: { name: `${ISAAC.name} ${ISAAC.version}`, role: "NVIDIA leftover. Only if you still have an RTX." },
  opencv: { name: "OpenCV", role: "Eyes. Edges and a track from the camera." },
});

export type Fence = { device: string; backend: Backend; family: "compute"; fence: number; ok: boolean; ms: number };

export type Lab = {
  name: "Asimov 01";
  under: "hector";
  world: World;
  bus: Bus;
  granted: boolean;
  last: Gate;
  track: { x: number; y: number; hit: boolean };
  edges: { w: number; h: number; px: Uint8ClampedArray };
  imu: Imu;
  team: Crew;
  house: House;
  hal: Partial<Record<Op, Fence>>;
};

export function openLab(): Lab {
  const b = wire(bus());
  const w = world();
  const lab: Lab = {
    name: "Asimov 01",
    under: "hector",
    world: w,
    bus: b,
    granted: false,
    last: { ok: true, law: 0, note: "Waiting for you." },
    track: { x: 40, y: 24, hit: false },
    edges: { w: 80, h: 48, px: new Uint8ClampedArray(80 * 48) },
    imu: { ax: 0, ay: 0, wz: 0 },
    team: crew({ amd: true, nvidia: true }),
    house: inhabit(),
    hal: {},
  };
  on(b, "/cmd_vel", (m) => {
    const d = m.data as { v: number; w: number };
    drive(lab, d.v, d.w);
  });
  return lab;
}

export function permit(lab: Lab, yes: boolean) {
  lab.granted = yes;
}

export function drive(lab: Lab, v: number, w: number) {
  const g = gate({ v, w }, lab.granted, lab.world.bot, lab.world.humans);
  lab.last = g;
  if (!g.ok) {
    lab.world.bot.v = 0;
    lab.world.bot.w = 0;
    return g;
  }
  lab.world.bot.v = v;
  lab.world.bot.w = w;
  return g;
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function seat(b: Backend): Seat {
  return b === "cuda" ? "cuda" : "rdna";
}

function through<T>(lab: Lab, job: Op, next: Op, work: () => T): T {
  const t0 = now();
  const out = work();
  const s = submit(job, now() - t0, true, next);
  lab.hal[job] = s;
  watch(job, seat(s.backend), s.ms, s.ok);
  pub(lab.bus, `/hal/${job}`, "v01d_msgs/Fence", s);
  return out;
}

export function pulse(lab: Lab, dt = 0.05) {
  tickClock(lab.bus, dt);
  lab.imu = through(lab, "step", "lidar", () => step(lab.world, dt));
  through(lab, "lidar", "vision", () => lab.world.scan.slice());
  const cam = camera(lab.world);
  const vis = through(lab, "vision", "imu", () => {
    const e = sobel(blur(gray(cam)));
    return { edges: e, track: track(e) };
  });
  lab.edges = vis.edges;
  lab.track = vis.track;
  through(lab, "imu", "step", () => lab.imu);
  lab.team = crew({ amd: true, nvidia: true });
  pub(lab.bus, "/host/home", "v01d_msgs/Home", lab.house);
  pub(lab.bus, "/rl/policy", "v01d_msgs/Policy", { note: lab.team.note, rl: sayRl(), queues: lab.hal });
  const b = lab.world.bot;
  pub(lab.bus, "/odom", "nav_msgs/Odometry", { x: b.x, y: b.y, th: b.th });
  pub(lab.bus, "/scan", "sensor_msgs/LaserScan", { ranges: lab.world.scan.slice() });
  pub(lab.bus, "/camera/image_raw", "sensor_msgs/Image", { w: cam.w, h: cam.h });
  pub(lab.bus, "/cv/edges", "sensor_msgs/Image", { w: lab.edges.w, h: lab.edges.h });
  pub(lab.bus, "/cv/track", "geometry_msgs/Point", lab.track);
  pub(lab.bus, "/imu", "sensor_msgs/Imu", lab.imu);
  chorus(lab.last.note);
  return topics(lab.bus);
}

export function laws() {
  return LAWS;
}

export function wantsAsimov(text: string) {
  return /\b(asimov(?:\s*01)?|robot(?:ics)?(?: lab)?|open (the )?lab|ros 2|gazebo|opencv|isaac sim|rdna|rocm|hipcc|cuda|gfx1201|v01d hal|vulkan)\b/i.test(text);
}
