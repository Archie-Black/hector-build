import { isLoopbackHost, isPrivateLan } from "../ollama/home.ts";

const APPROVED = (typeof process !== "undefined" ? process.env.HECTOR_SSH_HOSTS || "" : "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isOnionHost(host: string) {
  const h = host.trim().toLowerCase();
  return /^[a-z2-7]{56}\.onion$/.test(h) || /^[a-z2-7]{16}\.onion$/.test(h);
}

/** Hosts bots may SSH to: loopback, LAN, .onion, doomchat, or HECTOR_SSH_HOSTS. Humans may use any real host except link-local/metadata. */
export function safeSshHost(raw: string, mode: "bot" | "human" = "bot") {
  const host = raw.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || /\s/.test(host) || host.length > 253) return null;
  if (host === "0.0.0.0" || host.startsWith("169.254.") || host === "metadata.google.internal") return null;
  if (mode === "human") return host;
  if (isOnionHost(host)) return host;
  if (isLoopbackHost(host) || isPrivateLan(host)) return host;
  if (host === "doomchat.ca" || host.endsWith(".doomchat.ca")) return host;
  if (APPROVED.includes(host)) return host;
  return null;
}

const SAFE_CMD =
  /^(ls|pwd|whoami|date|uname( -a)?|hostname|git status|git diff|git log( -\d+)?|npm test|npm run typecheck|head( -n \d+)? [a-z0-9./_-]+|cat [a-z0-9./_-]+|grep -n? [a-z0-9._-]+ [a-z0-9./_-]+)$/i;

/** Bot-to-bot terminal. No pipes, no sudo, no rm. Humans in Studio can still type a full command. */
export function safeCollabCmd(raw: string) {
  const cmd = raw.trim().replace(/\s+/g, " ");
  if (!cmd || cmd.length > 240) return null;
  if (/[;&|`$<>(){}]|\\|!\s/.test(cmd)) return null;
  return SAFE_CMD.test(cmd) ? cmd : null;
}

export type LinkKind = "ssh" | "term" | "putty" | "onion";

export type CollabLink = {
  id: string;
  from: string;
  to: string;
  kind: LinkKind;
  host: string;
  port: number;
  user: string;
  session?: string;
  at: number;
};

export function puttyCommand(link: CollabLink, password?: string) {
  const target = `${link.user}@${link.host}`;
  return {
    putty: `putty -ssh ${target} -P ${link.port}`,
    plink: password
      ? `plink -ssh ${target} -P ${link.port} -pw ${password}`
      : `plink -ssh ${target} -P ${link.port}`,
    open: `ssh -p ${link.port} ${target}`,
  };
}
