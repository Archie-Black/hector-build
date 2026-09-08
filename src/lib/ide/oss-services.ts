export type OssKind = "LIVE" | "STUB";

export type OssService = {
  id: string;
  area: string;
  kind: OssKind;
  note: string;
  weight: number;
};

export const OSS_SURFACE: OssService[] = [
  { id: "wasm.engine", area: "WASM", kind: "STUB", note: "hx-vector.wasm instantiate", weight: 8 },
  { id: "wasm.wasi", area: "WASM", kind: "STUB", note: "WASI preview 1 host", weight: 7 },
  { id: "wasm.hyper", area: "WASM", kind: "STUB", note: "geometric hyper memory", weight: 7 },
  { id: "wasm.search", area: "WASM", kind: "STUB", note: "MDV search in WASM", weight: 8 },
  { id: "wasm.embed", area: "WASM", kind: "STUB", note: "288-d embed in WASM", weight: 6 },
  { id: "wasm.fathom", area: "WASM", kind: "STUB", note: "Fathom op in WASM", weight: 5 },
  { id: "wasm.memory", area: "WASM", kind: "STUB", note: "linear memory mapped", weight: 4 },
  { id: "editor.monaco", area: "Editor", kind: "LIVE", note: "Monaco = VS Code editor", weight: 6 },
  { id: "editor.minimap", area: "Editor", kind: "LIVE", note: "minimap, folding, multi-cursor", weight: 3 },
  { id: "editor.inline", area: "Editor", kind: "LIVE", note: "Tab ghost / inline completions", weight: 5 },
  { id: "editor.hover", area: "Languages", kind: "LIVE", note: "HoverProvider (lattice)", weight: 3 },
  { id: "editor.definition", area: "Languages", kind: "LIVE", note: "DefinitionProvider", weight: 3 },
  { id: "editor.references", area: "Languages", kind: "LIVE", note: "ReferenceProvider", weight: 3 },
  { id: "editor.symbols", area: "Languages", kind: "LIVE", note: "DocumentSymbolProvider", weight: 3 },
  { id: "editor.signature", area: "Languages", kind: "LIVE", note: "SignatureHelpProvider", weight: 2 },
  { id: "editor.rename", area: "Languages", kind: "LIVE", note: "RenameProvider", weight: 3 },
  { id: "editor.codeaction", area: "Languages", kind: "LIVE", note: "CodeActionProvider", weight: 2 },
  { id: "editor.highlights", area: "Languages", kind: "LIVE", note: "DocumentHighlightProvider", weight: 2 },
  { id: "editor.inlay", area: "Languages", kind: "LIVE", note: "InlayHintsProvider", weight: 2 },
  { id: "editor.links", area: "Languages", kind: "LIVE", note: "LinkProvider", weight: 1 },
  { id: "editor.folding", area: "Languages", kind: "LIVE", note: "FoldingRangeProvider", weight: 2 },
  { id: "editor.semantic", area: "Languages", kind: "LIVE", note: "DocumentSemanticTokens", weight: 2 },
  { id: "fs.workspace", area: "Files", kind: "LIVE", note: "workspace FS over granted files", weight: 4 },
  { id: "scm.git", area: "SCM", kind: "LIVE", note: "native git + workspace git", weight: 5 },
  { id: "debug.dap", area: "Debug", kind: "LIVE", note: "DAP workspace/node/python", weight: 5 },
  { id: "debug.breakpoints", area: "Debug", kind: "LIVE", note: "gutter breakpoints", weight: 3 },
  { id: "term.xterm", area: "Terminal", kind: "LIVE", note: "xterm.js panel", weight: 4 },
  { id: "ext.host", area: "Extensions", kind: "LIVE", note: "activation + contribute", weight: 4 },
  { id: "ext.openvsx", area: "Extensions", kind: "LIVE", note: "Open VSX marketplace", weight: 3 },
  { id: "ext.geometric", area: "Extensions", kind: "LIVE", note: "hx.lattice / hx.knot API", weight: 4 },
  { id: "commands", area: "Workbench", kind: "LIVE", note: "command registry + palette", weight: 3 },
  { id: "keybindings", area: "Workbench", kind: "LIVE", note: "Ctrl/Cmd palette save search", weight: 2 },
  { id: "problems", area: "Workbench", kind: "LIVE", note: "markers from checks", weight: 2 },
  { id: "output", area: "Workbench", kind: "LIVE", note: "output channel", weight: 2 },
  { id: "status", area: "Workbench", kind: "LIVE", note: "status bar", weight: 1 },
  { id: "views.explorer", area: "Workbench", kind: "LIVE", note: "explorer tree", weight: 3 },
  { id: "views.search", area: "Workbench", kind: "LIVE", note: "search view", weight: 3 },
  { id: "index.lattice", area: "Index", kind: "LIVE", note: "4 silent geometric agents", weight: 5 },
  { id: "index.morton", area: "Index", kind: "LIVE", note: "Morton bins + cosine", weight: 5 },
  { id: "geo.ontology", area: "Index", kind: "STUB", note: "hold / observe / knot twin", weight: 6 },
  { id: "align.cai", area: "Align", kind: "STUB", note: "constitutional AI + value learning", weight: 6 },
  { id: "align.asimov", area: "Align", kind: "LIVE", note: "Asimov laws immutable", weight: 8 },
  { id: "vault.geo", area: "Security", kind: "STUB", note: "geometric vault + TOTP", weight: 6 },
  { id: "vault.pqc", area: "Security", kind: "STUB", note: "ML-KEM-768 hybrid wrap", weight: 7 },
  { id: "webview", area: "Extensions", kind: "STUB", note: "extension webviews not hosted yet", weight: 3 },
  { id: "notebooks", area: "Editor", kind: "STUB", note: "notebooks not hosted yet", weight: 3 },
  { id: "ext.host.isolated", area: "Extensions", kind: "STUB", note: "not VS Code's isolated process", weight: 4 },
  { id: "lsp.stdio", area: "Languages", kind: "STUB", note: "stdio language servers not spawned", weight: 4 },
];

export function ossScore(list: OssService[] = OSS_SURFACE) {
  const liveN = list.filter((s) => s.kind === "LIVE").length;
  const liveW = list.filter((s) => s.kind === "LIVE").reduce((n, s) => n + s.weight, 0);
  const totalW = list.reduce((n, s) => n + s.weight, 0);
  return {
    live: liveN,
    total: list.length,
    weighted: liveW,
    weightTotal: totalW,
    pct: totalW ? Math.round((liveW / totalW) * 100) : 0,
  };
}
