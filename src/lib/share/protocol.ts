export const SHARE_PROTOCOL = "hector.share/v1";
export const SHARE_DIR = ".hector/share";

export type PeerKind =
  | "hector"
  | "hx"
  | "grok-build"
  | "cursor"
  | "codex"
  | "claude"
  | "openai"
  | "generic";

export type Peer = { id: string; name: string; kind: PeerKind; seen: number };
export type Lease = { path: string; bot: string; until: number };
export type Note = {
  id: string;
  from: string;
  to: string;
  kind: "task" | "result" | "note";
  body: string;
  at: number;
  ack?: string;
};
export type FileHead = { path: string; hash: string; bot: string; at: number };
export type ShareLink = {
  id: string;
  from: string;
  to: string;
  kind: "ssh" | "term" | "putty";
  host: string;
  port: number;
  user: string;
  session?: string;
  at: number;
};

export type Room = {
  protocol: typeof SHARE_PROTOCOL;
  id: string;
  peers: Peer[];
  leases: Lease[];
  inbox: Note[];
  heads: FileHead[];
  links: ShareLink[];
};

export function fnv(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function kindOf(name: string): PeerKind {
  const n = name.toLowerCase();
  if (/spectral|hx/.test(n)) return "hx";
  if (/hector/.test(n)) return "hector";
  if (/grok.?build|\.grok/.test(n)) return "grok-build";
  if (/cursor/.test(n)) return "cursor";
  if (/codex/.test(n)) return "codex";
  if (/claude/.test(n)) return "claude";
  if (/openai|chatgpt/.test(n)) return "openai";
  return "generic";
}

/** Other bots that already live in this folder. */
export function detectFolderBots(files: Record<string, string>): Peer[] {
  const now = Date.now();
  const out: Peer[] = [];
  const agents = files["AGENTS.md"] ?? "";
  if (/Grok Build/i.test(agents) || Object.keys(files).some((p) => p.startsWith(".grok/"))) {
    out.push({ id: "grok-build", name: "Grok Build", kind: "grok-build", seen: now });
  }
  if (files[".cursorrules"] || Object.keys(files).some((p) => p.startsWith(".cursor/"))) {
    out.push({ id: "cursor", name: "Cursor", kind: "cursor", seen: now });
  }
  if (files["AGENTS.md"] && /codex/i.test(agents)) {
    out.push({ id: "codex", name: "Codex", kind: "codex", seen: now });
  }
  if (files["CLAUDE.md"] || /claude/i.test(agents)) {
    out.push({ id: "claude", name: "Claude", kind: "claude", seen: now });
  }
  return out;
}

export const SHARE_README = `# Shared workspace (hector.share/v1)

Any build bot can work this folder with Hector.

1. Join: POST /api/v1/share  { "op":"join", "name":"Grok Build" }
2. Lease a path before you write it: { "op":"lease", "bot":"<id>", "path":"src/app.ts" }
3. Talk: { "op":"post", "from":"<id>", "to":"hector", "kind":"task", "body":"..." }
4. Sync a file: { "op":"sync", "bot":"<id>", "path":"src/app.ts", "content":"..." }
5. Pull: GET /api/v1/share
6. Terminal: POST { "op":"term", "bot":"<id>", "command":"git status" }  (allowlisted)
7. SSH: POST { "op":"ssh", "bot":"<id>", "host":"192.168.1.10", "user":"dev", "password":"...", "command":"uname -a" }
   Credentials stay in the backend (data/share/creds.json) and are reused. Not written into the project tree.
   PuTTY/plink on Windows: packaging\\\\windows\\\\hector-putty.cmd user@host

Same-folder bots: drop JSON notes into \`.hector/share/inbox.jsonl\` (one object per line).
MCP: /api/v1/mcp tools share_join, share_post, share_lease, share_pull, share_term, share_ssh, share_link.
`;
