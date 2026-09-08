import { useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { unifiedDiff } from "@/lib/ide/model";

export function TermPreview() {
  const pane = useForgeStore((s) => s.bottomPane);
  const termLines = useForgeStore((s) => s.termLines);
  const tests = useForgeStore((s) => s.tests);
  const files = useForgeStore((s) => s.files);
  const activePath = useForgeStore((s) => s.activePath);
  const checkpoint = useForgeStore((s) => s.checkpoint);
  const diffs = useForgeStore((s) => s.diffs);
  const hashes = useForgeStore((s) => s.hashes);
  const [cmd, setCmd] = useState("");
  const before = checkpoint?.[activePath] ?? files[activePath] ?? "";
  const after = files[activePath] ?? "";
  const rows = pane === "diff" ? unifiedDiff(before, after) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-line">
      <div className="flex h-8 shrink-0 items-center gap-1 px-2">
        {(["term", "problems", "diff"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={"h-7 rounded-md px-2 text-xs " + (pane === id ? "bg-raised text-fg" : "text-muted")}
            onClick={() => useForgeStore.getState().setBottomPane(id)}
          >
            {id === "term" ? "Terminal" : id === "problems" ? `Problems ${tests.filter((t) => !t.pass).length}` : "Diff"}
          </button>
        ))}
      </div>
      {pane === "term" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto px-3 font-mono text-xs text-muted">
            {termLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <form
            className="flex h-9 shrink-0 items-center gap-2 border-t border-line px-2"
            onSubmit={(e) => {
              e.preventDefault();
              useForgeStore.getState().runTerm(cmd);
              setCmd("");
            }}
          >
            <span className="font-mono text-xs text-subtle">$</span>
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="ls · cat · grep · test"
              className="h-8 flex-1 bg-transparent font-mono text-xs outline-none"
            />
          </form>
        </div>
      ) : null}
      {pane === "problems" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-1 font-mono text-xs">
          {tests.map((t) => (
            <p key={t.name} className={t.pass ? "text-pass" : "text-fail"}>
              {t.pass ? "ok" : "fail"} {t.name} {t.detail}
            </p>
          ))}
        </div>
      ) : null}
      {pane === "diff" ? (
        <div className="min-h-0 flex-1 overflow-auto px-3 py-1 font-mono text-xs">
          {diffs.map((d) => (
            <p key={d.path} className="text-muted">
              {d.path}
              {hashes[d.path] ? `  sha256 ${hashes[d.path].slice(0, 12)}` : ""}
            </p>
          ))}
          {rows.map((row, i) => (
            <p key={i} className={row.tag === "add" ? "text-pass" : row.tag === "del" ? "text-fail" : "text-subtle"}>
              {row.tag === "add" ? "+" : row.tag === "del" ? "-" : " "} {row.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
