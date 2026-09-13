/** OS V01D fabric. Traefik is the mouth. 10.13 is the blood. */

export const FABRIC = {
  name: "osv01d",
  edge: [80, 443] as const,
  overlay: "10.13.0.0/24",
  mesh: "10.13.1.0/24",
  hosts: {
    traefik: "10.13.0.2",
    app: "10.13.0.10",
    timescale: "10.13.0.20",
    vector: "10.13.0.30",
    prometheus: "10.13.0.40",
    otel: "10.13.0.45",
    wireguard: "10.13.0.3",
  },
  names: ["doomchat.ca", "www.doomchat.ca", "y.doomchat.ca", "hx.doomchat.ca"],
  trust: "loopback and overlay only. no postgres on the wire.",
  heal: "packaging/cloud/day2.sh",
} as const;

export type FabricStatus = {
  live: boolean;
  overlay: string;
  names: readonly string[];
  db: "timescale" | "pglite" | "neon" | "off";
};

export function publicPort(n: number) {
  return n === 80 || n === 443 || n === 51820;
}

export function onFabric(url = "") {
  const u = url || (typeof process !== "undefined" ? process.env.DATABASE_URL || "" : "");
  return u.includes(FABRIC.hosts.timescale);
}

export function status(url = ""): FabricStatus {
  const dbUrl = url || (typeof process !== "undefined" ? process.env.DATABASE_URL || "" : "");
  const db: FabricStatus["db"] = !dbUrl ? "pglite" : onFabric(dbUrl) ? "timescale" : "neon";
  return {
    live: db === "timescale",
    overlay: FABRIC.overlay,
    names: FABRIC.names,
    db,
  };
}

export async function pingFabric(): Promise<FabricStatus> {
  try {
    const r = await fetch("/api/v1/v01d/cloud");
    if (r.ok) return (await r.json()) as FabricStatus;
  } catch {
    /* desktop, no fabric */
  }
  return status();
}

export async function requestSite(action: "repair" | "scale" | "roll" | "backup" | "restore" | "mesh", copies = 2, peer = "") {
  try {
    const r = await fetch("/api/v1/v01d/cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, copies, peer }),
    });
    const j = (await r.json()) as { ok: boolean; note: string };
    return j;
  } catch {
    return { ok: false, note: "This machine is not hosting the website." };
  }
}

export async function requestAlerts() {
  try {
    const r = await fetch("/api/v1/v01d/alerts");
    if (r.ok) return (await r.json()) as { ok: boolean; note: string };
  } catch {
    /* desktop */
  }
  return { ok: true, note: "No website alerts are firing." };
}

export async function requestHeal() {
  return requestSite("repair");
}

export function wantsHeal(text: string) {
  return /\b(restart the (site|server|website|services)|fix the site|site is down|website is down|bring the site up)\b/i.test(text);
}

export function wantsScale(text: string) {
  return /\b(scale the website|more website copies|run \d+ website copies|add a website copy)\b/i.test(text);
}

export function wantsRoll(text: string) {
  return /\b(replace website copies|roll out the website|new website copy first)\b/i.test(text);
}

export function wantsBackup(text: string) {
  return /\b(backup the (site|website|database)|copy the database|snapshot the database)\b/i.test(text);
}

export function wantsRestore(text: string) {
  return /\b(restore the (site|website|database)|load the (dump|backup)|put the dump back)\b/i.test(text);
}

export function wantsMesh(text: string) {
  return /\b(add a website peer|join the second box|sync the website peer|second vps)\b/i.test(text);
}

export function wantsAlerts(text: string) {
  return /\b(website alerts|what('| i)?s (down|firing)|any alerts)\b/i.test(text);
}
