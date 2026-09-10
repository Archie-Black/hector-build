import type { ForgeMode } from "./types";

export type AgentRole = "lead" | "scout" | "patch" | "test" | "improve";

export type TaskStatus = "queued" | "assigned" | "active" | "done" | "blocked";

export type AgentTask = {
  id: string;
  title: string;
  assignee: AgentRole;
  status: TaskStatus;
  crew: number;
};

export const ROLE_LABEL: Record<AgentRole, string> = {
  lead: "Hector",
  scout: "Scout",
  patch: "Patch",
  test: "Checks",
  improve: "Hector",
};

export function planJob(prompt: string, mode: ForgeMode): AgentTask[] {
  const lead: AgentTask = {
    id: crypto.randomUUID(),
    title: "Break the job into assigned work",
    assignee: "lead",
    status: "active",
    crew: 1,
  };
  if (mode === "scout") {
    return [
      lead,
      { id: crypto.randomUUID(), title: "Survey the workspace", assignee: "scout", status: "assigned", crew: 2 },
    ];
  }
  if (mode === "plan") {
    return [
      lead,
      { id: crypto.randomUUID(), title: "Survey before planning", assignee: "scout", status: "assigned", crew: 2 },
      { id: crypto.randomUUID(), title: "Draft the plan", assignee: "lead", status: "queued", crew: 1 },
    ];
  }
  if (mode === "patch") {
    return [
      lead,
      { id: crypto.randomUUID(), title: "Inspect the change site", assignee: "scout", status: "assigned", crew: 2 },
      { id: crypto.randomUUID(), title: prompt.slice(0, 72) || "Apply the change", assignee: "patch", status: "queued", crew: 3 },
      { id: crypto.randomUUID(), title: "Run checks", assignee: "test", status: "queued", crew: 2 },
    ];
  }
  return [
    lead,
    { id: crypto.randomUUID(), title: "Map the problem", assignee: "scout", status: "assigned", crew: 2 },
    { id: crypto.randomUUID(), title: "Implement the full fix", assignee: "patch", status: "queued", crew: 4 },
    { id: crypto.randomUUID(), title: "Prove it with checks", assignee: "test", status: "queued", crew: 2 },
    { id: crypto.randomUUID(), title: "Record what to keep", assignee: "improve", status: "queued", crew: 1 },
  ];
}

export function advanceTasks(tasks: AgentTask[], traces: { name: string; ok: boolean }[]): AgentTask[] {
  const names = traces.map((t) => t.name);
  return tasks.map((task) => {
    if (task.assignee === "lead") return { ...task, status: "done" };
    if (task.assignee === "scout" && names.some((n) => n === "read_file" || n === "list_files" || n === "grep_files" || n === "lattice_search")) {
      return { ...task, status: traces.every((t) => t.ok) || names.length ? "done" : "active" };
    }
    if (task.assignee === "patch" && names.some((n) => n === "write_file" || n === "apply_patch")) {
      return { ...task, status: "done" };
    }
    if (task.assignee === "test" && names.includes("run_tests")) {
      return { ...task, status: traces.some((t) => t.name === "run_tests" && !t.ok) ? "blocked" : "done" };
    }
    if (task.assignee === "improve" && names.length) {
      return { ...task, status: "done" };
    }
    return task;
  });
}
