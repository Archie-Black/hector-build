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
    case "prove":
      return `HX proved the job (${detail}).` + fail;
    case "close_job":
      return ok ? "HX closed the job. HOLD." : `HX would not close (${detail}).`;
    case "share_join":
      return `A build bot joined the shared room (${detail}).` + fail;
    case "share_post":
      return `HX handed work to the shared room (${detail}).` + fail;
    case "share_lease":
      return `HX leased a path (${detail}).` + fail;
    case "share_sync":
      return `HX published a shared file (${detail}).` + fail;
    case "share_pull":
      return "HX pulled the shared workspace." + fail;
    case "share_term":
      return `HX used a shared terminal (${detail}).` + fail;
    case "share_ssh":
      return `HX ran SSH with another bot (${detail}).` + fail;
    case "share_link":
      return `HX published an SSH/PuTTY link (${detail}).` + fail;
    case "share_keys":
      return `HX managed SSH keys (${detail}).` + fail;
    case "web_search":
      return `Hector sent Punisher for the public web (${detail}).` + fail;
    case "web_fetch":
      return `Hector fetched a page (${detail}).` + fail;
    case "vision_scan":
      return `Hector looked at the bench (${detail}).` + fail;
    case "ptz_goto":
      return "Hector moved the camera." + fail;
    case "vision_camera":
      return `Hector set the camera (${detail}).` + fail;
    case "inspect_ui":
      return "Hector inspected the UI." + fail;
    case "mockup_code":
      return "Hector filed UI from the mockup." + fail;
    case "kvm_status":
      return "Hector checked the KVM seats." + fail;
    case "kvm_switch":
      return `Hector switched the KVM (${detail}).` + fail;
    case "kvm_grab":
      return `Hector grabbed a seat (${detail}).` + fail;
    case "kvm_key":
      return "Hector typed into the active seat." + fail;
    case "darwin_boot":
      return "Hector brought up the Darwin seat." + fail;
    case "darwin_sysctl":
      return `Darwin sysctl (${detail}).` + fail;
    case "darwin_status":
      return "Hector looked at Darwin." + fail;
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
