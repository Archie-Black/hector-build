import type { ForgeMode } from "./types";

export function pickMode(text: string): ForgeMode {
  const t = text.trim();
  if (t.startsWith("/plan")) return "plan";
  if (t.startsWith("/scout")) return "scout";
  if (t.startsWith("/patch")) return "patch";
  if (t.startsWith("/swarm") || t.startsWith("/hx")) return "swarm";
  const l = t.toLowerCase();
  if (/(^|\b)(plan|design the approach|propose steps)\b/.test(l) && !/(implement|fix|build)/.test(l)) {
    return "plan";
  }
  if (/(fix|repair|pass|implement|build|make .* work|broken|failing|tests?)/.test(l)) {
    return "swarm";
  }
  if (/(change|edit|patch|rename|replace|rewrite|update file)/.test(l)) {
    return "patch";
  }
  return "scout";
}

export function explainTrace(name: string, detail: string, ok: boolean): string {
  const fail = ok ? "" : " That step was blocked.";
  switch (name) {
    case "list_files":
    case "list_dir":
      return "Spectral HX listed the workspace." + fail;
    case "glob_files":
      return "HX Scout matched file names." + fail;
    case "grep_files":
    case "grep":
      return "HX Scout searched file contents." + fail;
    case "lattice_search":
      return "HX Scout walked the lattice." + fail;
    case "read_file":
      return `HX Scout read ${detail}.` + fail;
    case "write_file":
      return `HX Patch wrote ${detail}.` + fail;
    case "apply_patch":
    case "search_replace":
      return `HX Patch edited ${detail}.` + fail;
    case "run_tests":
      return `HX Checks ran tests (${detail}).` + fail;
    case "web_search":
      return `Spectral HX searched the web (${detail}).` + fail;
    case "web_fetch":
      return `Spectral HX fetched a page (${detail}).` + fail;
    case "todo_write":
      return "Spectral HX updated the task board." + fail;
    case "enter_plan_mode":
      return "Spectral HX entered plan mode. No writes until you approve." + fail;
    case "exit_plan_mode":
      return "Plan ready for your approval." + fail;
    case "spawn_subagent":
      return `Spectral HX spawned a subagent (${detail}).` + fail;
    case "bash":
      return `Sandbox command: ${detail}.` + fail;
    default:
      return `${name}: ${detail}` + fail;
  }
}
