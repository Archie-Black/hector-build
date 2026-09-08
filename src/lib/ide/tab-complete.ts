import { tabSuggest } from "@/lib/ide/indexer";

export function registerTabComplete(
  monaco: typeof import("monaco-editor"),
  getFiles: () => Record<string, string>,
  getPath: () => string,
) {
  const langs = ["javascript", "typescript", "python", "json", "markdown", "plaintext", "html", "css", "sql"];
  const disp = monaco.languages.registerInlineCompletionsProvider(langs, {
    provideInlineCompletions(model, position) {
      const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const insert = tabSuggest(getPath(), line, getFiles());
      if (!insert) return { items: [] };
      return {
        items: [
          {
            insertText: insert,
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          },
        ],
      };
    },
    disposeInlineCompletions() {
      /* noop */
    },
  });
  return disp;
}
