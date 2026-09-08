/** Next-gen Spectral HX memory: five layers, salience, decay, SQL-backed. */

export type MemoryLayer = "working" | "episodic" | "semantic" | "procedural" | "constitutional";

export type RecalledItem = {
  layer: MemoryLayer;
  text: string;
  score: number;
  hops?: string[];
};

export const CONSTITUTION = [
  "Never delete tests to make them pass.",
  "Label LIVE vs STUB. Never fake a host terminal, package install, or cloud VM.",
  "Read before you write.",
  "If a tool refuses, stop that path and say so.",
  "Once a project is granted, do not ask permission for each small task inside it.",
];

export function formatRecall(items: RecalledItem[]): string[] {
  const constitution = items.filter((i) => i.layer === "constitutional").map((i) => i.text);
  const rest = items
    .filter((i) => i.layer !== "constitutional")
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((i) => `[${i.layer}] ${i.text}`);
  return [...constitution, ...rest];
}
