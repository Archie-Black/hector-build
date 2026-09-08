import { useEffect, useRef } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { monacoLang } from "@/lib/ide/monaco-lang";
import { registerTabComplete } from "@/lib/ide/tab-complete";
import { registerOssLanguages } from "@/lib/ide/oss-languages";

export function MonacoPane() {
  const host = useRef<HTMLDivElement>(null);
  const files = useForgeStore((s) => s.files);
  const activePath = useForgeStore((s) => s.activePath);
  const value = files[activePath] ?? "";
  const editorRef = useRef<{
    setValue: (v: string) => void;
    getValue: () => string;
    getPath: () => string;
    setPath: (p: string) => void;
    dispose: () => void;
  } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false;
    void (async () => {
      const monaco = await import("monaco-editor");
      if (dead || !host.current) return;
      const editorWorker = await import("monaco-editor/esm/vs/editor/editor.worker.js?worker");
      const jsonWorker = await import("monaco-editor/esm/vs/language/json/json.worker.js?worker");
      const cssWorker = await import("monaco-editor/esm/vs/language/css/css.worker.js?worker");
      const htmlWorker = await import("monaco-editor/esm/vs/language/html/html.worker.js?worker");
      const tsWorker = await import("monaco-editor/esm/vs/language/typescript/ts.worker.js?worker");
      self.MonacoEnvironment = {
        getWorker(_id: string, label: string) {
          if (label === "json") return new jsonWorker.default();
          if (label === "css" || label === "scss" || label === "less") return new cssWorker.default();
          if (label === "html" || label === "handlebars" || label === "razor") return new htmlWorker.default();
          if (label === "typescript" || label === "javascript") return new tsWorker.default();
          return new editorWorker.default();
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
      editorRef.current = {
        setValue: (v) => {
          if (editor.getValue() !== v) editor.setValue(v);
        },
        getValue: () => editor.getValue(),
        getPath: () => useForgeStore.getState().activePath,
        setPath: (p) => {
          const model = monaco.editor.createModel(
            useForgeStore.getState().files[p] ?? "",
            monacoLang(p),
            monaco.Uri.parse(`file:///${p}`),
          );
          editor.setModel(model);
          syncBreaks(monaco, editor);
        },
        dispose: () => editor.dispose(),
      };
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

  return <div ref={host} className="hx-monaco min-h-0 min-w-0 flex-1" />;
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
