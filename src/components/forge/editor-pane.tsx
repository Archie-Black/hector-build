import { useEffect, useRef, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { isMod } from "@/lib/ide/keys";
import { langOf, lineCol } from "@/lib/ide/model";

export function EditorPane() {
  const files = useForgeStore((s) => s.files);
  const activePath = useForgeStore((s) => s.activePath);
  const openTabs = useForgeStore((s) => s.openTabs);
  const dirty = useForgeStore((s) => s.dirty);
  const value = files[activePath] ?? "";
  const lines = Math.max(1, value.split("\n").length);
  const box = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const [find, setFind] = useState("");
  const [findOpen, setFindOpen] = useState(false);

  useEffect(() => {
    box.current?.focus();
  }, [activePath]);

  function syncScroll() {
    if (gutter.current && box.current) gutter.current.scrollTop = box.current.scrollTop;
  }

  function onSelect() {
    const el = box.current;
    if (!el) return;
    const { line, col } = lineCol(value, el.selectionStart);
    useForgeStore.getState().setCursor(line, col);
  }

  function jumpFind() {
    if (!find) return;
    const el = box.current;
    if (!el) return;
    const from = el.selectionEnd;
    const idx = value.toLowerCase().indexOf(find.toLowerCase(), from);
    const at = idx >= 0 ? idx : value.toLowerCase().indexOf(find.toLowerCase());
    if (at < 0) return;
    el.focus();
    el.setSelectionRange(at, at + find.length);
    onSelect();
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 overflow-auto border-b border-line px-2 py-1">
        {openTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={
              "flex h-9 items-center gap-2 rounded-md px-2 font-mono text-xs " +
              (tab === activePath ? "bg-accent text-accent-fg" : "text-muted")
            }
            onClick={() => useForgeStore.getState().openPath(tab)}
          >
            {dirty[tab] ? "● " : ""}
            {tab.split("/").pop()}
            <span
              onClick={(e) => {
                e.stopPropagation();
                useForgeStore.getState().closeTab(tab);
              }}
            >
              ×
            </span>
          </button>
        ))}
        <p className="ml-auto shrink-0 px-2 font-mono text-xs text-subtle">{langOf(activePath)}</p>
      </div>
      {findOpen ? (
        <form
          className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-2"
          onSubmit={(e) => {
            e.preventDefault();
            jumpFind();
          }}
        >
          <input
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder="Find in file"
            className="h-8 flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />
          <button type="submit" className="h-8 px-2 text-xs text-muted">
            Next
          </button>
        </form>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <div ref={gutter} className="w-10 shrink-0 overflow-hidden border-r border-line py-3 text-right font-mono text-xs text-subtle">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="h-5 pr-2 leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={box}
          value={value}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-5 outline-none"
          onScroll={syncScroll}
          onSelect={onSelect}
          onClick={onSelect}
          onKeyUp={onSelect}
          onChange={(e) => {
            useForgeStore.getState().writeActive(e.target.value);
            onSelect();
          }}
          onKeyDown={(e) => {
            const mod = isMod(e);
            if (e.key === "Tab") {
              e.preventDefault();
              const el = box.current;
              if (!el) return;
              const s = el.selectionStart;
              const next = value.slice(0, s) + "  " + value.slice(el.selectionEnd);
              useForgeStore.getState().writeActive(next);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = s + 2;
              });
            }
            if (mod && e.key.toLowerCase() === "f") {
              e.preventDefault();
              setFindOpen(true);
            }
            if (mod && e.key.toLowerCase() === "s") {
              e.preventDefault();
              useForgeStore.getState().saveActive();
            }
          }}
        />
      </div>
    </section>
  );
}
