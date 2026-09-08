import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadBiSnapshot, type BiSnapshot } from "@/lib/superset/metrics";
import { probeSuperset } from "@/lib/superset/record";

const empty: BiSnapshot = { jobs: 0, ok: 0, fail: 0, traces: 0, lanes: [], tools: [], recent: [] };

export function HxDashboard() {
  const [probe, setProbe] = useState({ live: false, label: "warehouse" });
  const [snap, setSnap] = useState<BiSnapshot>(empty);

  useEffect(() => {
    void probeSuperset().then(setProbe);
    void loadBiSnapshot().then(setSnap);
    const tick = window.setInterval(() => {
      void loadBiSnapshot().then(setSnap);
    }, 8000);
    return () => window.clearInterval(tick);
  }, []);

  const rate = snap.jobs ? Math.round((snap.ok / snap.jobs) * 100) : 0;

  return (
    <section className="min-h-0 flex-1 overflow-auto p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg">Dashboards</h2>
        <Badge tone={probe.live ? "pass" : "muted"}>{probe.live ? "LIVE" : "STUB"}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardTitle>jobs</CardTitle>
          <p className="mt-2 text-2xl">{snap.jobs}</p>
        </Card>
        <Card>
          <CardTitle>ok</CardTitle>
          <p className="mt-2 text-2xl text-pass">{snap.ok}</p>
        </Card>
        <Card>
          <CardTitle>fail</CardTitle>
          <p className="mt-2 text-2xl text-fail">{snap.fail}</p>
        </Card>
        <Card>
          <CardTitle>pass rate</CardTitle>
          <p className="mt-2 text-2xl">{rate}%</p>
          <Progress className="mt-3" value={rate} />
        </Card>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>Crew by lane</CardTitle>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snap.lanes}>
                <XAxis dataKey="role" stroke="var(--color-subtle)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-subtle)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-raised)", border: "1px solid var(--color-line)", color: "var(--color-fg)" }}
                />
                <Bar dataKey="crew" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Tools</CardTitle>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snap.tools} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={96} stroke="var(--color-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-raised)", border: "1px solid var(--color-line)", color: "var(--color-fg)" }}
                />
                <Bar dataKey="n" fill="var(--color-pass)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <CardTitle>Recent jobs</CardTitle>
        {snap.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No jobs in the warehouse yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {snap.recent.map((job) => (
              <li key={job.id} className="flex items-start justify-between gap-3 text-sm">
                <p className="min-w-0 flex-1 truncate">{job.prompt}</p>
                <Badge tone={job.ok ? "pass" : "fail"}>{job.ok ? "ok" : "fail"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
