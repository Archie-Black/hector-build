/** ROS 2 plumbing: nodes, topics, a clock. The nerves of Asimov 01. */

export type Msg = { topic: string; type: string; data: unknown; stamp: number };

export type Node = { name: string; pubs: string[]; subs: string[] };

export type Bus = {
  t: number;
  nodes: Node[];
  last: Record<string, Msg>;
  sub: Record<string, ((m: Msg) => void)[]>;
};

export function bus(): Bus {
  return {
    t: 0,
    nodes: [
      { name: "/asimov/brain", pubs: ["/cmd_vel"], subs: ["/scan", "/cv/track"] },
      { name: "/asimov/base", pubs: ["/odom"], subs: ["/cmd_vel"] },
      { name: "/asimov/lidar", pubs: ["/scan"], subs: [] },
      { name: "/asimov/cam", pubs: ["/camera/image_raw"], subs: [] },
      { name: "/asimov/cv", pubs: ["/cv/edges", "/cv/track"], subs: ["/camera/image_raw"] },
      { name: "/asimov/hal", pubs: ["/hal/step", "/hal/lidar", "/hal/vision", "/hal/imu"], subs: [] },
      { name: "/asimov/rl", pubs: ["/rl/policy"], subs: ["/hal/step", "/hal/vision"] },
      { name: "/hector/mouth", pubs: ["/hector/say"], subs: ["/asimov/hear"] },
      { name: "/asimov/mouth", pubs: ["/asimov/say"], subs: ["/hector/hear"] },
    ],
    last: {},
    sub: {},
  };
}

export function tickClock(b: Bus, dt: number) {
  b.t += dt;
}

export function pub(b: Bus, topic: string, type: string, data: unknown) {
  const m: Msg = { topic, type, data, stamp: b.t };
  b.last[topic] = m;
  (b.sub[topic] || []).forEach((fn) => fn(m));
  return m;
}

export function on(b: Bus, topic: string, fn: (m: Msg) => void) {
  b.sub[topic] = b.sub[topic] || [];
  b.sub[topic].push(fn);
}

export function topics(b: Bus) {
  return Object.keys(b.last).sort();
}
