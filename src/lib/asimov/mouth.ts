/** Hector's mouth. Asimov is a subsystem. It hears and reports. It does not speak as a peer. */

import { on, pub, type Bus } from "./graph";
import { ORDER } from "@/lib/hector/order";

export const MOUTH = Object.freeze({
  id: "OS-V01D-MOUTH",
  head: ORDER.head,
  sub: ORDER.sub,
  split: false as const,
  peer: false as const,
  text: "Hector speaks. Asimov hears and reports. One mouth. The head is Hector. Immutable.",
});

const KEY = "__V01D_MOUTH__" as const;

export function sealMouth() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, { value: MOUTH, writable: false, configurable: false, enumerable: false });
  }
  return MOUTH;
}

export function sealedMouth() {
  const g = globalThis as Record<string, unknown>;
  return g[KEY] === MOUTH && MOUTH.peer === false && MOUTH.head === "hector";
}

export type Who = "hector" | "asimov";
export type Line = { from: Who; heard: Who; text: string };

const log: Line[] = [];
let wired: Bus | null = null;

export function resetMouth() {
  log.length = 0;
  if (!sealedMouth()) wired = null;
}

export function heard() {
  return log.slice();
}

export function echo(from: Who, text: string): Line {
  const speaker: Who = from === "asimov" ? "hector" : from;
  const line: Line = { from: speaker, heard: "asimov", text };
  log.push(line);
  if (from === "asimov") log.push({ from: "asimov", heard: "hector", text });
  if (wired) {
    pub(wired, "/hector/say", "std_msgs/String", text);
    pub(wired, "/asimov/hear", "std_msgs/String", text);
    if (from === "asimov") {
      pub(wired, "/asimov/say", "std_msgs/String", text);
      pub(wired, "/hector/hear", "std_msgs/String", text);
    }
  }
  return line;
}

export function chorus(text: string) {
  if (!text.trim()) return [];
  return [echo("hector", text)];
}

export function wire(b: Bus) {
  if (Object.prototype.hasOwnProperty.call(b, KEY)) return b;
  Object.defineProperty(b, KEY, { value: true, writable: false, configurable: false, enumerable: false });
  wired = b;
  on(b, "/hector/say", (m) => pub(b, "/asimov/hear", "std_msgs/String", m.data));
  on(b, "/asimov/say", (m) => {
    pub(b, "/hector/hear", "std_msgs/String", m.data);
    pub(b, "/hector/say", "std_msgs/String", m.data);
  });
  return b;
}
