import { useEffect, useState } from "react";
import { occupancy, statsOf, unpackFiles, type PackStats, type PackedVolume } from "@/lib/geopack/volume";
import { downloadBlob, loadVolume, saveBlobToFile, volumeBlob } from "@/lib/geopack/persist";
import { zipFiles } from "@/lib/geopack/zip";
import { runWorkspaceTests } from "@/lib/workspace/run-tests";
import type { TestResult } from "@/lib/workspace/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = { onClose?: () => void };

export function SandboxStage({ onClose }: Props) {
  const [vol, setVol] = useState<PackedVolume | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<PackStats | null>(null);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [active, setActive] = useState("");
  const [note, setNote] = useState("Mounting GeoPack…");
  const [cells, setCells] = useState<number[]>([]);

  useEffect(() => {
    void (async () => {
      const packed = await loadVolume();
      if (!packed) {
        setNote("STUB mount — no GeoPack volume yet. Open Sandbox from Spectral HX.");
        return;
      }
      const next = await unpackFiles(packed);
      setVol(packed);
      setFiles(next);
      setStats(statsOf(packed));
      setCells(occupancy(packed, 16));
      setTests(runWorkspaceTests(next));
      setActive(Object.keys(next)[0] ?? "");
      setNote("LIVE mount — isolated copy. Host NTFS/ext4 unchanged.");
    })();
  }, []);

  const html = files[active]?.includes("<html") ? files[active] : "";
  const pass = tests.filter((t) => t.pass).length;

  async function deploy() {
    downloadBlob(zipFiles(files), "hx-deploy.zip");
    setNote("LIVE Deploy Now — ZIP downloaded. Install that archive on the target host.");
  }

  async function saveFile() {
    if (!vol) return;
    const how = await saveBlobToFile(volumeBlob(vol), "project.geopack");
    setNote(how === "file" ? "LIVE Save to File — GeoPack written." : "LIVE Save to File — download (no file picker).");
  }

  return (
    <div className={"flex flex-col bg-bg text-fg " + (onClose ? "min-h-0 flex-1" : "h-dvh")}>
      <header className="flex h-12 shrink-0 items-center gap-2 px-3 glass-thin">
        <p className="text-sm">Sandbox</p>
        <Badge tone="pass">GeoPack</Badge>
        {onClose ? (
          <button type="button" className="ml-auto h-11 px-3 text-sm text-muted" onClick={onClose}>
            Close
          </button>
        ) : (
          <span className="ml-auto" />
        )}
        <Button type="button" size="sm" variant="line" onClick={() => void saveFile()} disabled={!vol}>
          Save to File
        </Button>
        <Button type="button" size="sm" onClick={() => void deploy()} disabled={!Object.keys(files).length}>
          Deploy Now
        </Button>
      </header>
      <p className="border-b border-line px-3 py-2 text-xs text-muted text-pretty">{note}</p>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[14rem_1fr_16rem]">
        <aside className="overflow-auto border-r border-line p-2">
          {Object.keys(files).map((path) => (
            <button
              key={path}
              type="button"
              className={
                "flex h-8 w-full items-center truncate rounded-md px-2 font-mono text-xs " +
                (path === active ? "bg-accent text-accent-fg" : "text-muted")
              }
              onClick={() => setActive(path)}
            >
              {path}
            </button>
          ))}
        </aside>
        <section className="min-h-0 overflow-auto p-3">
          {html ? (
            <iframe title="preview" className="h-full min-h-80 w-full rounded-md bg-raised" srcDoc={html} sandbox="" />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs text-muted">{(files[active] ?? "").slice(0, 4000)}</pre>
          )}
        </section>
        <aside className="overflow-auto border-l border-line p-3">
          <Card>
            <CardTitle>Checks</CardTitle>
            <p className={"mt-2 text-sm " + (pass === tests.length && tests.length ? "text-pass" : "text-fail")}>
              {pass}/{tests.length} pass
            </p>
            {tests.slice(0, 8).map((t) => (
              <p key={t.name} className="mt-1 font-mono text-xs text-muted">
                {t.pass ? "ok" : "fail"} {t.name}
              </p>
            ))}
          </Card>
          {stats ? (
            <Card className="mt-3">
              <CardTitle>GeoPack</CardTitle>
              <p className="mt-2 text-sm">{stats.files} files</p>
              <p className="text-sm text-muted">
                {stats.packed} / {stats.raw} bytes · {(stats.ratio * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-subtle">
                {stats.unique} unique chunks · {stats.bins} Morton bins
              </p>
              <div className="mt-3 grid gap-px" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                {cells.map((n, i) => (
                  <span
                    key={i}
                    className="block aspect-square rounded-sm"
                    style={{ background: n ? "var(--color-accent)" : "var(--color-inset)", opacity: n ? Math.min(1, 0.25 + n / 6) : 1 }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-subtle text-pretty">{stats.note}</p>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
