/** Last Prometheus alerts posted by Alertmanager. */

export type Fire = {
  name: string;
  summary: string;
  severity: string;
  status: "firing" | "resolved";
  at: string;
};

const g = globalThis as typeof globalThis & { __v01dAlerts__?: Fire[] };

function bucket() {
  if (!g.__v01dAlerts__) g.__v01dAlerts__ = [];
  return g.__v01dAlerts__;
}

export function ingest(body: unknown): Fire[] {
  const b = (body || {}) as { status?: string; alerts?: Array<Record<string, unknown>> };
  const list = Array.isArray(b.alerts) ? b.alerts : [];
  const now = new Date().toISOString();
  const incoming: Fire[] = list.map((a) => {
    const labels = (a.labels || {}) as Record<string, string>;
    const ann = (a.annotations || {}) as Record<string, string>;
    return {
      name: String(labels.alertname || "alert"),
      summary: String(ann.summary || labels.alertname || "alert"),
      severity: String(labels.severity || "warning"),
      status: a.status === "resolved" ? "resolved" : "firing",
      at: String(a.startsAt || now),
    };
  });
  const cur = bucket();
  for (const f of incoming) {
    const i = cur.findIndex((x) => x.name === f.name);
    if (i >= 0) cur[i] = f;
    else cur.push(f);
  }
  g.__v01dAlerts__ = cur.filter((x) => x.status === "firing").slice(-40);
  return g.__v01dAlerts__;
}

export function current() {
  return bucket().filter((x) => x.status === "firing");
}

export function sayAlerts(list = current()) {
  if (list.length === 0) return "No website alerts are firing.";
  return list.map((a) => a.summary).join(" ");
}
