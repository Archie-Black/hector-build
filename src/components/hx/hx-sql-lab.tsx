import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ensureWarehouse, listDatasets, runSqlLab } from "@/lib/memory/warehouse";

const STARTER = "SELECT name, kind, status FROM catalog.datasets ORDER BY name";

export function HxSqlLab() {
  const [sql, setSql] = useState(STARTER);
  const [error, setError] = useState<string | null>(null);
  const [cols, setCols] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [sets, setSets] = useState<{ name: string; kind: string; status: string }[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    void ensureWarehouse().then((r) => setLive(r.live));
    void listDatasets().then(setSets);
  }, []);

  async function run() {
    setError(null);
    const result = await runSqlLab({ data: sql });
    if (!result.ok) {
      setError(result.error ?? "Query failed.");
      setCols([]);
      setRows([]);
      return;
    }
    setCols(result.columns ?? []);
    setRows(result.rows ?? []);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <p className="text-sm">SQL Lab</p>
        <Badge tone={live ? "pass" : "muted"}>{live ? "LIVE DuckDB" : "STUB"}</Badge>
        <Button type="button" size="sm" className="ml-auto" onClick={() => void run()}>
          Run
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[14rem_1fr]">
        <aside className="overflow-auto border-r border-line p-3">
          <CardTitle>Datasets</CardTitle>
          {sets.map((d) => (
            <button
              key={d.name}
              type="button"
              className="mt-2 block w-full truncate rounded-md px-2 py-2 text-left font-mono text-xs text-muted"
              onClick={() => setSql(`SELECT * FROM ${d.name} LIMIT 50`)}
            >
              {d.name}
              <span className="block text-subtle">{d.kind}</span>
            </button>
          ))}
        </aside>
        <div className="flex min-h-0 flex-col">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="h-28 shrink-0 resize-none border-b border-line bg-inset px-3 py-2 font-mono text-sm outline-none"
            spellCheck={false}
          />
          {error ? <p className="px-3 py-2 text-sm text-fail">{error}</p> : null}
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {cols.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">Run a SELECT. Warehouse is read-only.</p>
              </Card>
            ) : (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c} className="border-b border-line px-2 py-2 text-subtle">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border-b border-line px-2 py-2">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
