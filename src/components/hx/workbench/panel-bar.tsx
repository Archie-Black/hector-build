import { useEffect, useRef } from "react";
import { TermPreview } from "@/components/forge/term-preview";
import { TuiDiffPane } from "@/components/forge/tui-diff-pane";
import { useForgeStore } from "@/lib/forge-store";

const TABS = [
  { id: "term", label: "Terminal" },
  { id: "problems", label: "Problems" },
  { id: "output", label: "Output" },
  { id: "debug", label: "Debug Console" },
  { id: "diff", label: "Diff" },
] as const;

export function PanelBar() {
  const pane = useForgeStore((s) => s.bottomPane);
  const tests = useForgeStore((s) => s.tests);
  const term = useForgeStore((s) => s.termLines);
  const xterm = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = xterm.current;
    if (!el || pane !== "term") return;
    let dispose: () => void = () => {};
    void (async () => {
      const xtermMod = await import("@xterm/xterm");
      const fitMod = await import("@xterm/addon-fit");
      const termInst = new xtermMod.Terminal({
        convertEol: true,
        fontFamily: "IBM Plex Mono, ui-monospace, Menlo, Consolas, monospace",
        fontSize: 12,
        theme: {
          background: "#000000",
          foreground: "#e8eef8",
          cursor: "#6ea8ff",
          selectionBackground: "#0047ab66",
        },
      });
      const fit = new fitMod.FitAddon();
      termInst.loadAddon(fit);
      termInst.open(el);
      fit.fit();
      for (const line of useForgeStore.getState().termLines) termInst.writeln(line);
      let buf = "";
      termInst.onData((d) => {
        if (d === "\r") {
          useForgeStore.getState().runTerm(buf);
          buf = "";
          termInst.write("\r\n");
        } else if (d === "\u007f") {
          buf = buf.slice(0, -1);
          termInst.write("\b \b");
        } else {
          buf += d;
          termInst.write(d);
        }
      });
      dispose = () => termInst.dispose();
    })();
    return () => dispose();
  }, [pane]);

  const fail = tests.filter((t) => !t.pass);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-line px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"h-8 px-2 text-xs tracking-wide uppercase " + (pane === t.id ? "text-fg" : "text-subtle")}
            onClick={() => useForgeStore.getState().setBottomPane(t.id)}
          >
            {t.label}
            {t.id === "problems" && fail.length ? ` ${fail.length}` : ""}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {pane === "term" ? <div ref={xterm} className="hx-xterm h-full w-full" /> : null}
        {pane === "problems" ? (
          <div className="overflow-auto p-2 font-mono text-xs">
            {fail.length === 0 ? <p className="text-pass">No problems</p> : null}
            {fail.map((t) => (
              <p key={t.name} className="text-fail">
                {t.name}: {t.detail}
              </p>
            ))}
          </div>
        ) : null}
        {pane === "output" ? (
          <div className="overflow-auto p-2 font-mono text-xs text-muted">
            {term.slice(-40).map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        ) : null}
        {pane === "debug" ? (
          <div className="overflow-auto p-2 font-mono text-xs">
            <p className="text-muted">Debug console · Spectral HX</p>
            {term
              .filter((l) => /debug|LIVE|fail|pass/i.test(l))
              .slice(-20)
              .map((l, i) => (
                <p key={i}>{l}</p>
              ))}
          </div>
        ) : null}
        {pane === "diff" ? <TuiDiffPane /> : null}
        {pane === "term" ? <div className="hidden"><TermPreview /></div> : null}
      </div>
    </section>
  );
}
