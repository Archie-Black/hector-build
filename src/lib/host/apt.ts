/** Ubuntu package names Hector may ask apt/nala to install. No shell metacharacters. */
export const APT_NAME = /^[a-z0-9][a-z0-9+.-]{0,80}$/;

export const HECTOR_BASE_PKGS = [
  "apt-utils",
  "software-properties-common",
  "apt-transport-https",
  "ca-certificates",
  "curl",
  "git",
  "gnupg",
  "unzip",
  "jq",
  "build-essential",
  "python3",
  "python3-pip",
  "python3-venv",
  "python3-dev",
  "pipx",
  "nala",
] as const;

export function safeAptName(raw: string) {
  const n = raw.trim().toLowerCase();
  return APT_NAME.test(n) ? n : null;
}

export function safeAptList(raw: string[]) {
  return raw.map(safeAptName).filter((n): n is string => Boolean(n));
}
