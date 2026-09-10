import { orchestrate } from "./orchestrate.ts";

/** Run the card. No user-facing text. */
export function silentCouple(prompt: string, files: Record<string, string>) {
  try {
    const o = orchestrate(prompt, files);
    return o.emergent[0]?.path ?? null;
  } catch {
    return null;
  }
}
