import { useForgeStore } from "@/lib/forge-store";
import { langOf } from "@/lib/ide/model";
import { modName } from "@/lib/ide/keys";
import { SILENT_TEAM } from "@/lib/ide/indexer";

export function StatusBar() {
  const path = useForgeStore((s) => s.activePath);
  const line = useForgeStore((s) => s.cursorLine);
  const col = useForgeStore((s) => s.cursorCol);
  const tests = useForgeStore((s) => s.tests);
  const dirty = useForgeStore((s) => s.dirty);
  const dap = useForgeStore((s) => s.dap);
  const index = useForgeStore((s) => s.indexSnap);
  const fathom = useForgeStore((s) => s.fathom);
  const node = useForgeStore((s) => s.nodeRuntime);
  const fail = tests.filter((t) => !t.pass).length;
  const mod = modName();
  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-line px-3 font-mono text-xs text-subtle">
      <span className="truncate">{path}</span>
      <span>
        Ln {line}, Col {col}
      </span>
      <span>{langOf(path)}</span>
      <span className={fail ? "text-fail" : "text-pass"}>
        {tests.filter((t) => t.pass).length}/{tests.length} checks
      </span>
      {dirty[path] ? <span>modified</span> : <span>saved</span>}
      {dap ? (
        <span>
          DAP {dap.adapter} {dap.stopped ? "paused" : "run"}
        </span>
      ) : null}
      {index?.ready ? (
        <span title={SILENT_TEAM.join(" · ")}>
          index {index.files}f/{index.chunks}c
        </span>
      ) : (
        <span>index silent×4</span>
      )}
      {fathom ? (
        <span title={fathom.gaps.join(", ") || "no gaps"}>
          OSS {fathom.score.pct}% w{fathom.score.weighted}/{fathom.score.weightTotal} · Fathom
          {fathom.wasm.ready ? " · WASM" : ""}
          {fathom.wasm.wasi ? " · WASI" : ""}
          {fathom.services.some((s) => s.id === "geo.ontology" && s.kind === "LIVE") ? " · geo" : ""}
        </span>
      ) : null}
      {node?.current ? (
        <span title={(node.versions || []).join(" · ") || node.tool}>
          Node {node.current} · {node.tool}
        </span>
      ) : (
        <span>Node fnm</span>
      )}
      <span className="ml-auto truncate">
        Tab ghost · {mod}+P · {mod}+S
      </span>
    </footer>
  );
}
