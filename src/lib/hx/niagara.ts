/** Spectral Horizon 00:13. GPU drip from UE MenuDrip.usf. One sim. Many writes. */
import { ENGINE_DRIP } from "@/lib/v01d/engine-sfx";

export type Burst = "drip" | "lava" | "play" | "heat";

export type Event = { kind: Burst; x: number; heat: number };

export type Channel = { q: Event[]; heat: number; burst: number; x: number };

export function heat(tick: number) {
  return 0.28 + ((tick % 180) / 180) * 0.55;
}

function hxHash(n: number) {
  const x = Math.sin(n) * ENGINE_DRIP.hash;
  return x - Math.floor(x);
}

/** Same column drip as native/horizon/UE/SpectralHorizon/Shaders/MenuDrip.usf */
export function hxDrip(uvx: number, uvy: number, time: number, heatAmt: number) {
  const x = uvx * 9;
  const cell = Math.floor(x);
  const k = hxHash(cell * 17.13);
  const thick = 0.05 + 0.11 * k * heatAmt;
  const fx = x - Math.floor(x);
  const column = 1 - smoothstep(0, thick, Math.abs(fx - 0.5));
  const speed = 0.09 + 0.22 * heatAmt * (0.4 + k);
  const y = (uvy + time * speed + k) % 1;
  const head = smoothstep(0.18, 0, Math.abs(y - 0.12));
  const tail = Math.min(1, Math.max(0, (1 - y) * 1.4)) * 0.55;
  const visc = column ** (1.6 + heatAmt);
  return visc * (head + tail);
}

export function emissive(d: number, heatAmt: number) {
  const u = ENGINE_DRIP.uranium;
  const lava = ENGINE_DRIP.lava;
  const cob = ENGINE_DRIP.cobalt;
  const hot = heatAmt;
  const mid = [u[0] + (lava[0] - u[0]) * hot, u[1] + (lava[1] - u[1]) * hot, u[2] + (lava[2] - u[2]) * hot];
  return [cob[0] + (mid[0] - cob[0]) * d, cob[1] + (mid[1] - cob[1]) * d, cob[2] + (mid[2] - cob[2]) * d];
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0 || 1)));
  return t * t * (3 - 2 * t);
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
