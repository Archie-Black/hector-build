/**
 * 7B and 14B do not get bigger. Geometry makes them spend KV on the
 * collapsed working set. 7B scouts. 14B collapses.
 */
import { braidOfText, reduceBraid, writhe } from "./braid.ts";
import type { ForgeMode } from "../workspace/types.ts";

export type GeoLane = "fast" | "best";

function knotWrithe(prompt: string) {
  return writhe(reduceBraid(braidOfText(prompt)));
}

export function geoLane(prompt: string, mode: ForgeMode, traces: { name: string }[] = []): GeoLane {
  if (traces.some((t) => /write_file|apply_patch|search_replace|prove|run_tests/.test(t.name))) return "best";
  if (mode === "scout" || mode === "plan") return "fast";
  if (mode === "patch" || mode === "swarm") return "best";
  if (/\b(implement|refactor|prove|fix the|write|patch)\b/i.test(prompt)) return "best";
  return Math.abs(knotWrithe(prompt)) >= 4 ? "best" : "fast";
}

export function geoPack(files: Record<string, string>, prompt: string, budget = 2400) {
  const w = knotWrithe(prompt);
  const q = prompt.toLowerCase();
  const paths = Object.keys(files)
    .sort((a, b) => {
      const sa = q.split(/\s+/).filter((t) => a.toLowerCase().includes(t)).length;
      const sb = q.split(/\s+/).filter((t) => b.toLowerCase().includes(t)).length;
      return sb - sa;
    })
    .slice(0, 5);
  const body = paths.map((p) => `### ${p}\n${(files[p] ?? "").slice(0, 280)}`).join("\n\n");
  const geo = `geo W=${w}`;
  return { paths, text: `${geo}\n${body}`.slice(0, budget), geo, lane: geoLane(prompt, "patch") as GeoLane };
}

export function geoUser(files: Record<string, string>, prompt: string) {
  const pack = geoPack(files, prompt);
  if (!pack.paths.length) return prompt;
  return `${pack.geo}\n${pack.text}\n\n${prompt}`;
}

export function pickLaneModel(lane: GeoLane, fast: string, best: string) {
  return lane === "best" ? best : fast;
}
