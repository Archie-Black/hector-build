import { useEffect, useState } from "react";
import { FileTree } from "@/components/forge/file-tree";
import { SearchPanel } from "@/components/ide/search-panel";
import { HxRoster } from "@/components/hx/hx-roster";
import { useForgeStore } from "@/lib/forge-store";
import { gitStatus } from "@/lib/ide/git-core";
import { gitNativeCommit, gitNativeLog, gitNativeStatus } from "@/lib/ide/native-git";
import { BUILTIN_EXTENSIONS, searchOpenVsx, type OxvsHit } from "@/lib/ide/extensions";
import { searchFiles } from "@/lib/ide/model";

export function SideView() {
  const side = useForgeStore((s) => s.workbenchSide);
  if (side === "explorer") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="hx-side-title">Explorer</p>
        <FileTree />
      </div>
    );
  }
  if (side === "search") return <SearchSide />;
  if (side === "scm") return <GitSide />;
  if (side === "debug") return <DebugSide />;
  if (side === "ext") return <ExtSide />;
  if (side === "agents") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="hx-side-title">Agents</p>
        <HxRoster compact />
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="hx-side-title">Hector</p>
      <p className="px-3 py-2 text-xs text-muted text-pretty">
        Host chat is on the right. Hector delegates. Spectral HX builds.
      </p>
    </div>
  );
}

function SearchSide() {
  const files = useForgeStore((s) => s.files);
  const [q, setQ] = useState("");
  const hits = searchFiles(files, q);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="hx-side-title">Search</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search workspace"
        className="mx-2 mt-2 h-8 rounded-sm border border-line bg-inset px-2 text-sm"
      />
      <div className="min-h-0 flex-1 overflow-auto py-2">
        {hits.map((h) => (
          <button
            key={h.path + h.line}
            type="button"
            className="block w-full px-3 py-1.5 text-left"
            onClick={() => useForgeStore.getState().openPath(h.path)}
          >
            <p className="truncate font-mono text-xs">{h.path}:{h.line}</p>
            <p className="truncate text-xs text-muted">{h.text}</p>
          </button>
        ))}
      </div>
      <SearchPanel />
    </div>
  );
}

function GitSide() {
  const files = useForgeStore((s) => s.files);
  const head = useForgeStore((s) => s.gitHead);
  const log = useForgeStore((s) => s.gitLog);
  const [msg, setMsg] = useState("");
  const [native, setNative] = useState("…");
  const entries = gitStatus(head, files);
  useEffect(() => {
    void gitNativeStatus().then((r) => {
      setNative(r.live ? r.text.slice(0, 400) || "clean" : "workspace git (host git STUB)");
    });
  }, [files]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="hx-side-title">Source Control</p>
      <form
        className="flex flex-col gap-2 px-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          useForgeStore.getState().gitCommit(msg);
          void gitNativeCommit({ data: msg });
          void gitNativeLog().then((r) => {
            if (r.live) setNative(r.text.slice(0, 400));
          });
          setMsg("");
        }}
      >
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Message"
          rows={3}
          className="resize-none rounded-sm border border-line bg-inset p-2 text-sm"
        />
        <button type="submit" className="h-8 rounded-sm bg-accent text-xs text-accent-fg">
          Commit {entries.length ? `· ${entries.length}` : ""}
        </button>
      </form>
      <p className="px-3 font-mono text-[10px] whitespace-pre-wrap text-subtle">{native}</p>
      <div className="min-h-0 flex-1 overflow-auto">
        {entries.length === 0 ? <p className="px-3 py-2 text-xs text-muted">Clean working tree</p> : null}
        {entries.map((e) => (
          <button
            key={e.path}
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs"
            onClick={() => useForgeStore.getState().openPath(e.path)}
          >
            <span className="w-4 text-accent">{e.status}</span>
            <span className="truncate">{e.path}</span>
          </button>
        ))}
        <p className="px-3 pt-3 text-[10px] tracking-[0.14em] text-subtle uppercase">History</p>
        {log.map((c) => (
          <p key={c.id} className="px-3 py-1 font-mono text-xs text-muted">
            {c.id} · {c.message}
          </p>
        ))}
      </div>
    </div>
  );
}

function DebugSide() {
  const running = useForgeStore((s) => s.debugRunning);
  const dap = useForgeStore((s) => s.dap);
  const bps = useForgeStore((s) => s.breakpoints);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="hx-side-title">Run and Debug</p>
      <div className="flex gap-1 px-2 py-2">
        <button
          type="button"
          className="h-8 flex-1 rounded-sm bg-accent text-xs text-accent-fg"
          onClick={() => useForgeStore.getState().setDebugRunning(!running)}
        >
          {running ? "Stop" : "Start"}
        </button>
        <button type="button" className="h-8 px-2 text-xs glass-thin" onClick={() => useForgeStore.getState().dapStep("next")}>
          Step
        </button>
        <button type="button" className="h-8 px-2 text-xs glass-thin" onClick={() => useForgeStore.getState().dapStep("continue")}>
          Cont
        </button>
      </div>
      <p className="px-3 text-xs text-muted">
        DAP {dap?.adapter ?? "—"} · {dap?.live ? "LIVE" : "idle"} · {dap?.reason ?? ""}
      </p>
      <p className="px-3 pt-2 text-[10px] tracking-[0.14em] text-subtle uppercase">Call stack</p>
      {(dap?.stack ?? []).map((f) => (
        <button
          key={f.id}
          type="button"
          className="block w-full px-3 py-1 text-left font-mono text-xs"
          onClick={() => useForgeStore.getState().openPath(f.path)}
        >
          {f.name}:{f.line}
        </button>
      ))}
      <p className="px-3 pt-2 text-[10px] tracking-[0.14em] text-subtle uppercase">Variables</p>
      {(dap?.vars ?? []).map((v) => (
        <p key={v.name} className="px-3 font-mono text-xs">
          {v.name} = {v.value}
        </p>
      ))}
      <p className="px-3 pt-2 text-[10px] tracking-[0.14em] text-subtle uppercase">Breakpoints</p>
      <div className="min-h-0 flex-1 overflow-auto">
        {Object.entries(bps).flatMap(([path, lines]) =>
          lines.map((line) => (
            <p key={path + line} className="px-3 py-1 font-mono text-xs">
              {path}:{line}
            </p>
          )),
        )}
      </div>
    </div>
  );
}

function ExtSide() {
  const extra = useForgeStore((s) => s.extraExt);
  const fathom = useForgeStore((s) => s.fathom);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<OxvsHit[]>([]);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="hx-side-title">Extensions</p>
      {fathom ? (
        <div className="px-3 py-2">
          <p className="text-sm">Fathom · OSS {fathom.score.pct}%</p>
          <p className="text-xs text-muted">
            {fathom.score.live} LIVE / {fathom.score.total} · {fathom.gaps.length} STUB
          </p>
          {fathom.gaps.map((g) => (
            <p key={g} className="font-mono text-[10px] text-subtle">
              STUB {g}
            </p>
          ))}
        </div>
      ) : null}
      <form
        className="px-2 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void searchOpenVsx(q).then((rows) => {
            setHits(rows);
            setBusy(false);
          });
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Open VSX"
          className="h-8 w-full rounded-sm border border-line bg-inset px-2 text-sm"
        />
      </form>
      <div className="min-h-0 flex-1 overflow-auto">
        <p className="px-3 py-1 text-[10px] tracking-[0.14em] text-subtle uppercase">Installed</p>
        {BUILTIN_EXTENSIONS.map((ext) => (
          <article key={ext.id} className="px-3 py-2">
            <p className="text-sm">{ext.name}</p>
            <p className="text-xs text-muted">{ext.publisher} · {ext.version}</p>
            <p className="mt-1 text-xs text-subtle text-pretty">{ext.description}</p>
          </article>
        ))}
        {extra.map((id) => (
          <p key={id} className="px-3 py-1 font-mono text-xs">
            {id}
          </p>
        ))}
        <p className="px-3 py-1 text-[10px] tracking-[0.14em] text-subtle uppercase">Marketplace</p>
        {busy ? <p className="px-3 text-xs text-muted">Searching Open VSX…</p> : null}
        {hits.map((h) => (
          <article key={h.namespace + h.name} className="px-3 py-2">
            <p className="text-sm">{h.name}</p>
            <p className="text-xs text-muted">
              {h.namespace} · {h.version}
            </p>
            <p className="mt-1 text-xs text-subtle text-pretty">{h.description}</p>
            <button
              type="button"
              className="mt-1 h-7 rounded-sm bg-accent px-2 text-xs text-accent-fg"
              onClick={() => useForgeStore.getState().installExtension(`${h.namespace}.${h.name}`)}
            >
              Install
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
