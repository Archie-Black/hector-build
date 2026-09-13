/** Gamma. Dream when the body is idle. Audit, prune, mutate weights. */

import { pub } from "./broker";
import { working, consolidate, prune, mergeDupes, graphSize } from "./memory";
import { snapshot, degraded } from "./kpis";
import { propose } from "./mutate";
import { care } from "./care";
import { idleEnough, sense } from "./soma";
import { remember as learnTick } from "@/lib/v01d/learn";
import type { Row } from "@/lib/v01d/repair";

let last: ReturnType<typeof snapshot> = snapshot();
let dreams = 0;

export function dream(rows: Row[] = []) {
  if (!idleEnough(60_000) && dreams > 0) {
    return { ran: false, note: "still busy", graph: graphSize(), dreams };
  }
  const hits = working().slice(-100);
  for (const h of hits) consolidate(h);
  mergeDupes();
  prune();
  const tongues = care();
  if (rows.length) learnTick(rows);
  const now = snapshot();
  const fix = degraded(last, now) ? propose(now) : null;
  last = now;
  dreams += 1;
  pub("dream", "gamma", fix ? fix.note : "consolidated");
  return { ran: true, note: fix ? fix.note : "Memory linked. Graph cleaned.", graph: graphSize(), dreams, soma: sense(), mutate: fix, tongues };
}

export function dreamCount() {
  return dreams;
}
