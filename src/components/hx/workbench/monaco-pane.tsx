import { useEffect, useRef, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { monacoLang } from "@/lib/ide/monaco-lang";
import { registerTabComplete } from "@/lib/ide/tab-complete";
import { registerOssLanguages } from "@/lib/ide/oss-languages";

type Props = {
  onEdit?: (instruction: string, selection: string, path: string, start: number, end: number) => void;
};

export function MonacoPane({ onEdit }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const files = useForgeStore((s) => s.files);
  const activePath = useForgeStore((s) => s.activePath);
  const lints = useForgeStore((s) => s.lints);
  const value = files[activePath] ?? "";
  const [ask, setAsk] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const selRef = useRef({ text: "", start: 1, end: 1 });
  const editorRef = useRef<{
    setValue: (v: string) => void;
    getValue: () => string;
    getPath: () => string;
    setPath: (p: string) => void;
    dispose: () => void;
    monaco: typeof import("monaco-editor") | null;
    editor: import("monaco-editor").editor.IStandaloneCodeEditor | null;
  } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    void (async () => {
      const monaco = await import("monaco-editor");
      if (dead || !host.current) return;
      self.MonacoEnvironment = {
        getWorker() {
          const src = "self.onmessage=function(){};";
          return new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
        },
      };
      monaco.editor.defineTheme("spectral-hx", {
        base: "vs-dark",
        inherit: true,
        colors: {
          "editor.background": "#000000",
          "editor.foreground": "#e8eef8",
          "editor.lineHighlightBackground": "#0c1220",
          "editorCursor.foreground": "#6ea8ff",
          "editor.selectionBackground": "#0047ab66",
          "editorLineNumber.foreground": "#5c6780",
          "editorLineNumber.activeForeground": "#e8eef8",
          "editorGutter.background": "#000000",
          "minimap.background": "#070b14",
          "editorWidget.background": "#0c1220",
          "editorWidget.border": "#1a2740",
          "editorSuggestWidget.background": "#0c1220",
          "editorSuggestWidget.selectedBackground": "#0047ab",
          "scrollbarSlider.background": "#0047ab55",
        },
        rules: [
          { token: "comment", foreground: "5c6780", fontStyle: "italic" },
          { token: "keyword", foreground: "6ea8ff" },
          { token: "string", foreground: "9ecbff" },
          { token: "number", foreground: "7ec8c8" },
          { token: "type", foreground: "8bb4ff" },
        ],
      });
      monaco.editor.setTheme("spectral-hx");
      const editor = monaco.editor.create(host.current, {
        value: useForgeStore.getState().files[useForgeStore.getState().activePath] ?? "",
        language: monacoLang(useForgeStore.getState().activePath),
        theme: "spectral-hx",
        automaticLayout: true,
        fontFamily: "IBM Plex Mono, ui-monospace, Menlo, Consolas, monospace",
        fontSize: 13,
        minimap: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "all",
        padding: { top: 8 },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        glyphMargin: true,
        folding: true,
        bracketPairColorization: { enabled: true },
        inlineSuggest: { enabled: true },
        quickSuggestions: { other: true, comments: false, strings: true },
        tabCompletion: "on",
      });
      registerTabComplete(
        monaco,
        () => useForgeStore.getState().files,
        () => useForgeStore.getState().activePath,
      );
      registerOssLanguages(
        monaco,
        () => useForgeStore.getState().files,
        () => useForgeStore.getState().activePath,
      );
      editor.onDidChangeModelContent(() => {
        const path = useForgeStore.getState().activePath;
        useForgeStore.getState().writeActive(editor.getValue());
        void path;
      });
      editor.onDidChangeCursorPosition((e) => {
        useForgeStore.getState().setCursor(e.position.lineNumber, e.position.column);
      });
      editor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && e.target.position) {
          const line = e.target.position.lineNumber;
          useForgeStore.getState().toggleBreakpoint(useForgeStore.getState().activePath, line);
          syncBreaks(monaco, editor);
        }
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        useForgeStore.getState().saveActive();
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        const sel = editor.getSelection();
        const model = editor.getModel();
        if (!sel || !model) return;
        const text = model.getValueInRange(sel) || model.getLineContent(sel.startLineNumber);
        selRef.current = { text, start: sel.startLineNumber, end: sel.endLineNumber };
        setAsk(text.slice(0, 80));
        setDraft("");
      });
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        useForgeStore.getState().formatActive();
      });
      monaco.editor.registerEditorOpener({
        openCodeEditor(_source, resource) {
          const path = resource.path.replace(/^\//, "");
          if (useForgeStore.getState().files[path] !== undefined) {
            useForgeStore.getState().openPath(path);
            return true;
          }
          return false;
        },
      });
      editorRef.current = {
        setValue: (v) => {
          if (editor.getValue() !== v) editor.setValue(v);
        },
        getValue: () => editor.getValue(),
        getPath: () => useForgeStore.getState().activePath,
        setPath: (p) => {
          const uri = monaco.Uri.parse("inmemory://hx/" + p.replace(/^\//, ""));
          let model = monaco.editor.getModel(uri);
          const content = useForgeStore.getState().files[p] ?? "";
          if (!model) model = monaco.editor.createModel(content, monacoLang(p), uri);
          else if (model.getValue() !== content) model.setValue(content);
          editor.setModel(model);
          syncBreaks(monaco, editor);
        },
        dispose: () => editor.dispose(),
        monaco,
        editor,
      };
      editorRef.current.setPath(useForgeStore.getState().activePath);
      syncBreaks(monaco, editor);
    })();
    return () => {
      dead = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getPath() !== activePath) ed.setPath(activePath);
    else if (ed.getValue() !== value) ed.setValue(value);
  }, [activePath, value]);

  useEffect(() => {
    const pack = editorRef.current;
    if (!pack?.monaco || !pack.editor) return;
    const model = pack.editor.getModel();
    if (!model) return;
    pack.monaco.editor.setModelMarkers(
      model,
      "hx-lint",
      lints
        .filter((l) => l.path === activePath)
        .map((l) => ({
          startLineNumber: l.line,
          startColumn: l.col,
          endLineNumber: l.line,
          endColumn: l.col + 1,
          message: l.message,
          severity:
            l.severity === "error"
              ? pack.monaco!.MarkerSeverity.Error
              : pack.monaco!.MarkerSeverity.Warning,
        })),
    );
  }, [lints, activePath]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {ask !== null ? (
        <form
          className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2"
          onSubmit={(e) => {
            e.preventDefault();
            const instruction = draft.trim();
            if (instruction && onEdit) {
              onEdit(instruction, selRef.current.text, activePath, selRef.current.start, selRef.current.end);
            }
            setAsk(null);
            setDraft("");
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Edit selection…"
            className="h-11 flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAsk(null);
                setDraft("");
              }
            }}
          />
        </form>
      ) : null}
      <div ref={host} className="hx-monaco min-h-0 min-w-0 flex-1" />
    </div>
  );
}

function syncBreaks(
  monaco: typeof import("monaco-editor"),
  editor: import("monaco-editor").editor.IStandaloneCodeEditor,
) {
  const path = useForgeStore.getState().activePath;
  const lines = useForgeStore.getState().breakpoints[path] ?? [];
  monaco.editor.setModelMarkers(editor.getModel()!, "hx-bp", []);
  editor.createDecorationsCollection(
    lines.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: "hx-breakpoint",
        className: "hx-breakpoint-line",
      },
    })),
  );
}
