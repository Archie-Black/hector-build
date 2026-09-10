export const LANES = ["core", "git", "term", "model", "browser", "preview", "build", "ssh", "onion", "vision"] as const;
export type Lane = (typeof LANES)[number];

const ALWAYS: Lane[] = ["core", "git", "term", "model"];

const HINTS: { lane: Lane; re: RegExp }[] = [
  { lane: "browser", re: /\b(chrome|edge|brave|firefox|browser|webkit|playwright|puppeteer|selenium|open (the )?page|click the|fill the form)\b/i },
  { lane: "preview", re: /\b(preview|localhost|live view|hot reload|vite)\b/i },
  { lane: "build", re: /\b(npm |pnpm |yarn |pip |pytest|jest|vitest|cargo |compile|typecheck|webpack|build the)\b/i },
  { lane: "ssh", re: /\b(ssh|putty|scp|remote host|wsl)\b/i },
  { lane: "onion", re: /\b(onion|\.onion|tor circuit|hidden service|dark horse)\b/i },
  { lane: "git", re: /\b(git |commit|pull request|clone|branch|merge|repo)\b/i },
  { lane: "vision", re: /\b(camera|ptz|workbench|arduino|pcb|screenshot|mockup|figma|inspect ui|thermal|punisher)\b/i },
];

export function lookAhead(prompt: string): Lane[] {
  const hit = new Set<Lane>(ALWAYS);
  const text = prompt.trim();
  if (!text) return [...hit];
  for (const { lane, re } of HINTS) {
    if (re.test(text)) hit.add(lane);
  }
  if (/\.(html|css|tsx|jsx|vue)\b/i.test(text)) hit.add("browser");
  if (/\bhttps?:\/\//i.test(text)) hit.add("browser");
  return LANES.filter((l) => hit.has(l));
}
