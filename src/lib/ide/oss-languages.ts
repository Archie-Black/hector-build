import { retrieve } from "@/lib/ide/indexer";

const LANGS = ["javascript", "typescript", "python", "json", "markdown", "html", "css", "sql", "plaintext"];

function wordAt(model: import("monaco-editor").editor.ITextModel, pos: import("monaco-editor").Position) {
  const line = model.getLineContent(pos.lineNumber);
  const left = line.slice(0, pos.column - 1).match(/[A-Za-z0-9_./-]+$/)?.[0] ?? "";
  const right = line.slice(pos.column - 1).match(/^[A-Za-z0-9_./-]+/)?.[0] ?? "";
  return left + right;
}

export function registerOssLanguages(
  monaco: typeof import("monaco-editor"),
  getFiles: () => Record<string, string>,
  getPath: () => string,
) {
  const files = () => getFiles();
  monaco.languages.registerHoverProvider(LANGS, {
    provideHover(model, pos) {
      const w = wordAt(model, pos);
      if (!w) return null;
      const hit = retrieve(w, 1)[0];
      return {
        contents: [{ value: `**${w}**  \n${hit ? hit.path + " · lattice" : "no lattice neighbor"}` }],
      };
    },
  });
  monaco.languages.registerDefinitionProvider(LANGS, {
    provideDefinition(model, pos) {
      const w = wordAt(model, pos);
      const hit = retrieve(w, 1)[0];
      if (!hit) return [];
      const uri = monaco.Uri.parse(`file:///${hit.path}`);
      const line = Math.max(1, model.getLineCount() > 0 && hit.path === getPath() ? pos.lineNumber : 1);
      return [{ uri, range: new monaco.Range(line, 1, line, 1) }];
    },
  });
  monaco.languages.registerReferenceProvider(LANGS, {
    provideReferences(model, pos) {
      const w = wordAt(model, pos);
      return retrieve(w, 6).map((h) => ({
        uri: monaco.Uri.parse(`file:///${h.path}`),
        range: new monaco.Range(1, 1, 1, 1),
      }));
    },
  });
  monaco.languages.registerDocumentSymbolProvider(LANGS, {
    provideDocumentSymbols(model) {
      const text = model.getValue();
      const out: import("monaco-editor").languages.DocumentSymbol[] = [];
      const re = /(?:function|class|def|const|let|export)\s+([A-Za-z0-9_]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const start = model.getPositionAt(m.index);
        out.push({
          name: m[1],
          detail: "",
          kind: monaco.languages.SymbolKind.Function,
          range: new monaco.Range(start.lineNumber, 1, start.lineNumber, 80),
          selectionRange: new monaco.Range(start.lineNumber, 1, start.lineNumber, 80),
          tags: [],
        });
      }
      return out.slice(0, 80);
    },
  });
  monaco.languages.registerSignatureHelpProvider(LANGS, {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, pos) {
      const w = wordAt(model, pos);
      return {
        value: {
          signatures: [{ label: `${w}(…)`, parameters: [{ label: "arg" }] }],
          activeSignature: 0,
          activeParameter: 0,
        },
        dispose() {
          /* noop */
        },
      };
    },
  });
  monaco.languages.registerRenameProvider(LANGS, {
    provideRenameEdits(model, pos, newName) {
      const w = wordAt(model, pos);
      const edits: import("monaco-editor").languages.IWorkspaceTextEdit[] = [];
      if (!w) return { edits };
      const text = model.getValue();
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const a = model.getPositionAt(m.index);
        const b = model.getPositionAt(m.index + w.length);
        edits.push({
          resource: model.uri,
          versionId: model.getVersionId(),
          textEdit: { range: new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column), text: newName },
        });
      }
      return { edits };
    },
  });
  monaco.languages.registerCodeActionProvider(LANGS, {
    provideCodeActions() {
      return {
        actions: [
          {
            title: "Index this range in the lattice",
            kind: "quickfix",
            command: { id: "hx.lattice.reindex", title: "Reindex" },
          },
        ],
        dispose() {
          /* noop */
        },
      };
    },
  });
  monaco.languages.registerDocumentHighlightProvider(LANGS, {
    provideDocumentHighlights(model, pos) {
      const w = wordAt(model, pos);
      if (!w) return [];
      const hits: import("monaco-editor").languages.DocumentHighlight[] = [];
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
      const text = model.getValue();
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const a = model.getPositionAt(m.index);
        const b = model.getPositionAt(m.index + w.length);
        hits.push({
          range: new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column),
          kind: monaco.languages.DocumentHighlightKind.Text,
        });
      }
      return hits.slice(0, 40);
    },
  });
  monaco.languages.registerInlayHintsProvider(LANGS, {
    provideInlayHints(model) {
      const hints: import("monaco-editor").languages.InlayHint[] = [];
      const path = getPath();
      const n = Object.keys(files()).length;
      hints.push({
        label: `lattice · ${n} files`,
        position: { lineNumber: 1, column: 1 },
        kind: monaco.languages.InlayHintKind.Type,
      });
      void path;
      return { hints, dispose() {} };
    },
  });
  monaco.languages.registerLinkProvider(LANGS, {
    provideLinks(model) {
      const links: import("monaco-editor").languages.ILink[] = [];
      const re = /https?:\/\/[^\s)"']+/g;
      const text = model.getValue();
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const a = model.getPositionAt(m.index);
        const b = model.getPositionAt(m.index + m[0].length);
        links.push({ range: new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column), url: m[0] });
      }
      return { links };
    },
  });
  monaco.languages.registerFoldingRangeProvider(LANGS, {
    provideFoldingRanges(model) {
      const ranges: import("monaco-editor").languages.FoldingRange[] = [];
      let start = 0;
      for (let i = 1; i <= model.getLineCount(); i++) {
        const t = model.getLineContent(i);
        if (t.includes("{") || t.trimEnd().endsWith(":")) start = i;
        if ((t.includes("}") || t.startsWith("def ") === false) && start && i - start > 2) {
          ranges.push({ start, end: i, kind: monaco.languages.FoldingRangeKind.Region });
          start = 0;
        }
      }
      return ranges.slice(0, 80);
    },
  });
  monaco.languages.registerDocumentSemanticTokensProvider(LANGS, {
    getLegend() {
      return { tokenTypes: ["namespace", "class", "function", "variable"], tokenModifiers: ["declaration"] };
    },
    provideDocumentSemanticTokens() {
      return { data: new Uint32Array(), resultId: "0" };
    },
    releaseDocumentSemanticTokens() {
      /* noop */
    },
  });
  void getPath;
}
