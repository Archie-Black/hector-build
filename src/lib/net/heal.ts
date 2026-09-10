import { alloc } from "../os/mm.ts";
import {
  NET_AGENTS,
  netStatus,
  probe,
  quietNet,
  report,
  snapshot,
  type SockRow,
} from "./stack.ts";

async function revive(row: SockRow): Promise<string> {
  if (quietNet()) return "STUB quiet";
  if (row.id === "socks" || row.id === "ctrl") {
    const onion = await import("../share/onion.ts");
    onion.startOnionDaemon();
    return "started tor";
  }
  if (row.id === "ssh") {
    const onion = await import("../share/onion.ts");
    onion.ensureCollabSsh();
    return "started collab ssh";
  }
  return "watch";
}

export async function heal() {
  const snap = await snapshot();
  const actions: string[] = [];
  for (const row of snap.socks) {
    if (row.state !== "down") continue;
    row.state = "healing";
    const note = await revive(row);
    const up = quietNet() ? false : await probe(row.host, row.port, 800);
    row.state = up ? "up" : "down";
    row.note = up ? note : `${note}; still down`;
    actions.push(`${row.name}: ${row.note}`);
  }
  const ok = snap.socks.filter((s) => s.id === "http" || s.state === "up").length > 0;
  const text = actions.length ? actions.join("; ") : "stack quiet";
  const folded = report({ from: "netd", to: "hector", ok, text });
  report({ from: "heal", to: "netd", ok, text });
  alloc("hector", "episodic", `netd: ${text}`.slice(0, 240), ok ? 1 : 0.5);
  return { ...netStatus(), snap, folded };
}

export async function tickNet() {
  if (quietNet()) {
    const snap = await snapshot();
    report({ from: "netd", to: "hector", ok: true, text: "quiet tick" });
    return { ...netStatus(), snap };
  }
  return heal();
}

export function netRoster() {
  return NET_AGENTS;
}
