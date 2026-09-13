/** Spectral Horizon 00:13. One sim. Many writes. */
export type Burst = "drip" | "lava" | "play" | "heat";

export type Event = { kind: Burst; x: number; heat: number };

export type Channel = { q: Event[]; heat: number; burst: number; x: number };

export function heat(tick: number) {
  return 0.28 + ((tick % 180) / 180) * 0.55;
}

export function drip(tick: number): Event {
  return { kind: "drip", x: (tick % 8) / 8, heat: heat(tick) };
}

export function boot(): Channel {
  return { q: [], heat: 0.37, burst: 0, x: 0.5 };
}

export function publish(c: Channel, e: Event): Channel {
  const q = c.q.length > 31 ? c.q.slice(-31).concat(e) : c.q.concat(e);
  return {
    q,
    x: e.x,
    heat: e.kind === "play" ? 1 : Math.min(1, c.heat * 0.9 + e.heat * 0.14),
    burst: e.kind === "play" ? 1 : c.burst * 0.88,
  };
}

export function step(c: Channel, tick: number): Channel {
  return publish(c, drip(tick));
}
