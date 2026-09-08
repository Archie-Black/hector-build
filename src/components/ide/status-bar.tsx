import { useForgeStore } from "@/lib/forge-store";
import { langOf } from "@/lib/ide/model";
import { modName } from "@/lib/ide/keys";

export function StatusBar() {
  const path = useForgeStore((s) => s.activePath);
  const line = useForgeStore((s) => s.cursorLine);
  const col = useForgeStore((s) => s.cursorCol);
  const tests = useForgeStore((s) => s.tests);
  const dirty = useForgeStore((s) => s.dirty);
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
      <span className="ml-auto truncate">
        {mod}+P palette · {mod}+S save · {mod}+Shift+F search
      </span>
    </footer>
  );
}
