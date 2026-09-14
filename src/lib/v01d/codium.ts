/** VSCodium is the heavy editor inside Spectral HX. Agents use tasks, not a second chrome. */

export const CODIUM = Object.freeze({
  bin: "/opt/vscodium/bin/codium",
  local: "runtime/vscodium/bin/codium",
  install: "packaging/linux/install-vscodium.sh",
  workspace: "v01d/hx",
  tasks: "packaging/hx/codium/.vscode/tasks.json",
  settings: "packaging/hx/codium/.vscode/settings.json",
  card: "packaging/hx/CODIUM.md",
});

export const AGENT_TASKS = [
  { id: "typecheck", label: "Typecheck", cmd: "npx tsc --noEmit" },
  { id: "test", label: "Test", cmd: "npx vitest run" },
  { id: "build", label: "Build", cmd: "npm run build" },
  { id: "doctor", label: "Doctor", cmd: "bash packaging/linux/doctor.sh" },
  { id: "iso", label: "ISO profile", cmd: "bash packaging/arch/mkiso.sh" },
] as const;

export const TERMINAL_PROFILES = ["Machine Core", "Spectral HX"] as const;

export function wantsCodium(text: string) {
  return /\b(vscodium|codium|heavy editor|open the editor augment)\b/i.test(text);
}

export function sayCodium() {
  return "Spectral HX. VSCodium is the heavy editor. Ghosts use workspace tasks and Machine Core terminals.";
}
