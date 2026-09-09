import { retrieve } from "@/lib/ide/indexer";
import { completeTokens, findDefinition, findReferences, indexSymbols } from "@/lib/ide/symbols";

const LANGS = ["javascript", "typescript", "python", "json", "markdown", "html", "css", "sql", "plaintext"];

function wordAt(model: import("monaco-editor").editor.ITextModel, pos: import("monaco-editor").Position) {
  const line = model.getLineContent(pos.lineNumber);
  const left = line.slice(0, pos.column - 1).match(/[A-Za-z0-9_./-]+$/)?.[0] ?? "";
  const right = line.slice(pos.column - 1).match(/^[A-Za-z0-9_./-]+/)?.[0] ?? "";
  return left + right;
}

function uriOf(monaco: typeof import("monaco-editor"), path: string) {
  return monaco.Uri.parse("inmemory://hx/" + path.replace(/^\//, ""));
}

export function registerOssLanguages(
  monaco: typeof import("monaco-editor"),
  getFiles: () => Record<string, string>,
  getPath: () => string,
) {
  monaco.languages.registerHoverProvider(LANGS, {
    provideHover(model, pos) {
      const w = wordAt(model, pos);
      if (!w) return null;
      const def = findDefinition(getFiles(), w, getPath());
      const hit = retrieve(w, 1)[0];
      const line = def ? `${def.path}:${def.line}` : hit ? hit.path + " · lattice" : "no neighbor";
      return { contents: [{ value: `**${w}**  \n${def?.text ?? line}` }] };
    },
  });
  monaco.languages.registerDefinitionProvider(LANGS, {
    provideDefinition(_model, pos) {
      const w = wordAt(_model, pos);
      const def = findDefinition(getFiles(), w, getPath());
      if (!def) return [];
      return [{ uri: uriOf(monaco, def.path), range: new monaco.Range(def.line, def.col, def.line, def.col + w.length) }];
    },
  });
  monaco.languages.registerReferenceProvider(LANGS, {
    provideReferences(model, pos) {
      const w = wordAt(model, pos);
      return findReferences(getFiles(), w).map((h) => ({
        uri: uriOf(monaco, h.path),
        range: new monaco.Range(h.line, h.col, h.line, h.col + w.length),
      }));
    },
  });
  monaco.languages.registerDocumentSymbolProvider(LANGS, {
    provideDocumentSymbols() {
      const path = getPath();
      return indexSymbols(getFiles())
        .filter((s) => s.path === path && s.kind !== "import")
        .slice(0, 80)
        .map((s) => ({
          name: s.name,
          detail: s.kind,
          kind:
            s.kind === "class"
              ? monaco.languages.SymbolKind.Class
              : s.kind === "fn"
                ? monaco.languages.SymbolKind.Function
                : monaco.languages.SymbolKind.Variable,
          range: new monaco.Range(s.line, 1, s.line, 80),
          selectionRange: new monaco.Range(s.line, 1, s.line, 80),
          tags: [],
        }));
    },
  });
  monaco.languages.registerCompletionItemProvider(LANGS, {
    triggerCharacters: [".", "/", "@"],
    provideCompletionItems(model, pos) {
      const line = model.getLineContent(pos.lineNumber).slice(0, pos.column - 1);
      const token = line.match(/[A-Za-z0-9_./-]+$/)?.[0] ?? "";
      const names = completeTokens(getPath(), token, getFiles());
      const paths = Object.keys(getFiles()).filter((p) => p.includes(token)).slice(0, 8);
      const items = [
        ...names.map((n) => ({
          label: n,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: n.slice(token.length),
          range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
        })),
        ...paths.map((p) => ({
          label: p,
          kind: monaco.languages.CompletionItemKind.File,
          insertText: p,
          range: new monaco.Range(pos.lineNumber, pos.column - token.length, pos.lineNumber, pos.column),
        })),
      ];
      return { suggestions: items };
    },
  });
  monaco.languages.registerSignatureHelpProvider(LANGS, {
    signatureHelpTriggerCharacters: ["(", ","],
    provideSignatureHelp(model, pos) {
      const w = wordAt(model, pos);
      const def = findDefinition(getFiles(), w, getPath());
      return {
        value: {
          signatures: [{ label: def?.text || `${w}(…)`, parameters: [{ label: "arg" }] }],
          activeSignature: 0,
          activeParameter: 0,
        },
        dispose() {
          /* noop */
        },
      };
    },
  });
}
