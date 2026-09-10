import { create } from "zustand";
import { seedFiles } from "@/lib/workspace/seed";
import { runWorkspaceTests } from "@/lib/workspace/run-tests";
import {
  emptyMemory,
  lessonFromTurn,
  mergeLessons,
  type MetaMemory,
} from "@/lib/workspace/memory";
import { loadVisitorKey, saveVisitorKey } from "@/lib/workspace/keys";
import { openHxSoftware, openSandboxWindow, publishLive } from "@/lib/hx/live";
import { packFiles, statsOf, type PackStats } from "@/lib/geopack/volume";
import { saveVolume } from "@/lib/geopack/persist";
import { loadProvider, saveProvider, type ChatProviderId } from "@/lib/workspace/providers";
import { computeProgress } from "@/lib/workspace/progress";
import { SEED_LIBRARY, type LibraryProject } from "@/lib/workspace/library";
import { resolveImmutablePlatform, type LockedPlatform } from "@/lib/workspace/platform";
import { applyHost, loadHost, saveHost, type HostSettings } from "@/lib/workspace/host-settings";
import { applyTheme, loadTheme, type ThemeName } from "@/lib/workspace/theme";
import { loadBench, saveBench } from "@/lib/workspace/bench";
import { pathAllowed } from "@/lib/workspace/acl";
import { gitStatus, newCommitId } from "@/lib/ide/git-core";
import { dapContinue, dapNext, pickAdapter, workspaceLaunch, type DapSession } from "@/lib/ide/dap";
import { silentIndex, type IndexSnapshot } from "@/lib/ide/indexer";
import { fathomAssure, type FathomReport } from "@/lib/ide/fathom-agent";
import { pinnedNode } from "@/lib/ide/node-pin";
import { nodeRuntimeStatus, nodeRuntimeUse, type NodeRuntime } from "@/lib/ide/node-runtime.server";
import { advanceTasks, planJob, type AgentRole, type AgentTask, type TaskStatus } from "@/lib/workspace/team";
import {
  buildDailyUpdate,
  fetchHostUpdates,
  defaultUpdateSettings,
  loadUpdateSettings,
  saveUpdateSettings,
  todayStamp,
  type PendingUpdate,
  type UpdatePolicy,
  type UpdateSettings,
} from "@/lib/workspace/updates";
import { diagnostics, formatFile, type Lint } from "@/lib/ide/symbols";
import type {
  AgentTodo,
  ChatMessage,
  FileDiff,
  ForgeMode,
  TestResult,
  ToolTrace,
} from "@/lib/workspace/types";

export type AppSurface = "title" | "work" | "maze" | "journal" | "paint" | "studio" | "winamp";
export type WorkPhase = "idle" | "plan" | "awaiting" | "apply" | "review";

export type VerboseLine = { id: string; text: string; at: number };

type ForgeState = {
  files: Record<string, string>;
  messages: ChatMessage[];
  traces: ToolTrace[];
  tests: TestResult[];
  busy: boolean;
  draft: string;
  granted: boolean;
  memory: MetaMemory;
  status: string;
  ownerReady: boolean;
  visitorKey: string;
  providerId: ChatProviderId;
  baseUrl: string;
  model: string;
  needKey: boolean;
  observe: boolean;
  progress: number;
  verbose: VerboseLine[];
  repo: string;
  software: string[];
  tasks: AgentTask[];
  hxOpen: boolean;
  hxDetached: boolean;
  updates: UpdateSettings;
  platform: LockedPlatform;
  host: HostSettings;
  theme: ThemeName;
  library: LibraryProject[];
  sandbox: boolean;
  sandboxSnap: Record<string, string> | null;
  sandboxOverlay: boolean;
  packStats: PackStats | null;
  railOpen: boolean;
  todos: AgentTodo[];
  diffs: FileDiff[];
  plan: string;
  sessionMode: ForgeMode;
  surface: AppSurface;
  activePath: string;
  openTabs: string[];
  phase: WorkPhase;
  checkpoint: Record<string, string> | null;
  hashes: Record<string, string>;
  spend: number;
  spendCap: number;
  allowlist: string[];
  termLines: string[];
  dirty: Record<string, boolean>;
  cursorLine: number;
  cursorCol: number;
  bottomPane: "term" | "problems" | "output" | "debug" | "diff";
  paletteOpen: boolean;
  searchOpen: boolean;
  settingsOpen: boolean;
  lastJob: string;
  chip: boolean;
  fileSeal: boolean;
  pinSeal: boolean;
  breakpoints: Record<string, number[]>;
  gitHead: Record<string, string> | null;
  gitLog: { id: string; message: string; at: number; files: number }[];
  workbenchSide: "explorer" | "search" | "scm" | "debug" | "ext" | "hector" | "agents";
  hostChatOpen: boolean;
  debugRunning: boolean;
  extraExt: string[];
  dap: DapSession | null;
  indexSnap: IndexSnapshot | null;
  gitNative: boolean;
  fathom: FathomReport | null;
  lints: Lint[];
  nodeRuntime: NodeRuntime | null;
  setDraft: (draft: string) => void;
  grant: () => void;
  setBusy: (busy: boolean) => void;
  setStatus: (status: string) => void;
  setOwnerReady: (ready: boolean) => void;
  setVisitorKey: (key: string) => void;
  setChatProvider: (next: { id: ChatProviderId; baseUrl: string; model: string; key: string }) => void;
  setNeedKey: (need: boolean) => void;
  setObserve: (open: boolean) => void;
  pushVerbose: (text: string) => void;
  approveSoftware: (name: string) => void;
  setRepo: (repo: string) => void;
  addFiles: (incoming: Record<string, string>) => void;
  planTasks: (prompt: string, mode: ForgeMode) => void;
  spawnLane: (role: AgentRole, title: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  openHx: () => void;
  closeHx: () => void;
  pushMessage: (msg: ChatMessage) => void;
  applyAgentFiles: (files: Record<string, string>) => void;
  setTraces: (traces: ToolTrace[]) => void;
  hydrateMemory: (memory: MetaMemory) => void;
  remember: (lesson: string) => void;
  reviewMemory: (traces: ToolTrace[]) => void;
  setUpdatePolicy: (policy: UpdatePolicy) => void;
  setInstallHour: (hour: number) => void;
  queueDailyUpdate: () => void;
  approveUpdate: () => void;
  dismissUpdate: () => void;
  maybeSilentInstall: () => void;
  hydrateChrome: () => void;
  setTheme: (theme: ThemeName) => void;
  setHost: (patch: Partial<HostSettings>) => void;
  setRailOpen: (open: boolean) => void;
  toggleSandbox: () => void;
  openSandbox: () => Promise<void>;
  closeSandbox: () => void;
  addLibrary: (project: LibraryProject) => void;
  setPlan: (plan: string) => void;
  setTodos: (todos: AgentTodo[]) => void;
  setDiffs: (diffs: FileDiff[]) => void;
  setSessionMode: (mode: ForgeMode) => void;
  setSurface: (surface: AppSurface) => void;
  openPath: (path: string) => void;
  closeTab: (path: string) => void;
  writeActive: (content: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  saveActive: () => void;
  setCursor: (line: number, col: number) => void;
  setBottomPane: (pane: "term" | "problems" | "output" | "debug" | "diff") => void;
  setPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  runTerm: (line: string) => void;
  setPhase: (phase: WorkPhase) => void;
  setSpendCap: (cap: number) => void;
  addAllow: (path: string) => void;
  pushTerm: (line: string) => void;
  toggleBreakpoint: (path: string, line: number) => void;
  gitCommit: (message: string) => void;
  setWorkbenchSide: (side: ForgeState["workbenchSide"]) => void;
  setHostChatOpen: (open: boolean) => void;
  setDebugRunning: (running: boolean) => void;
  installExtension: (id: string) => void;
  startDap: () => void;
  dapStep: (kind: "continue" | "next") => void;
  runSilentIndex: () => void;
  bootHost: () => void;
  takeCheckpoint: () => void;
  undoApply: () => void;
  sealHashes: (hashes: Record<string, string>) => void;
  addSpend: (n: number) => boolean;
  markChip: (on: boolean) => void;
  setLastJob: (job: string) => void;
  runChecks: () => void;
  resetWorkspace: () => void;
  formatActive: () => void;
  refreshNode: () => void;
  useNode: (version: string) => void;
};

const welcome: ChatMessage = {
  id: "welcome",
  role: "system",
  content:
    "I am Hector. Tell me what to build.",
};

function persistUpdates(updates: UpdateSettings) {
  saveUpdateSettings(updates);
  return updates;
}

export const useForgeStore = create<ForgeState>()((set, get) => ({
  files: seedFiles(),
  messages: [welcome],
  traces: [],
  tests: runWorkspaceTests(seedFiles()),
  busy: false,
  draft: "",
  granted: true,
  memory: emptyMemory(),
  status: "Ready.",
  ownerReady: true,
  visitorKey: "",
  providerId: "hector",
  baseUrl: "/api/v1",
  model: "hector-hx",
  needKey: false,
  observe: false,
  progress: 0,
  verbose: [
    {
      id: "boot",
      text: "Spectral HX standing by. No writes until the project is granted.",
      at: Date.now(),
    },
  ],
  repo: "",
  software: [],
  tasks: [],
  hxOpen: false,
  hxDetached: false,
  updates: defaultUpdateSettings(),
  platform: "linux",
  host: {
    os: "linux",
    verbose: false,
    ghosts: true,
    notifications: true,
    reducedMotion: false,
    fontScale: 1,
    keyboard: "desktop",
    autoStart: true,
  },
  theme: "dark",
  library: SEED_LIBRARY,
  sandbox: false,
  sandboxSnap: null,
  sandboxOverlay: false,
  packStats: null,
  railOpen: false,
  todos: [],
  diffs: [],
  plan: "",
  sessionMode: "scout",
  surface: "title",
  activePath: "demo/main.py",
  openTabs: ["demo/main.py"],
  phase: "idle",
  checkpoint: null,
  hashes: {},
  spend: 0,
  spendCap: 20,
  allowlist: [],
  termLines: ["Workspace shell LIVE for ls / cat / grep / test. Host OS commands stay STUB."],
  dirty: {},
  cursorLine: 1,
  cursorCol: 1,
  bottomPane: "term",
  paletteOpen: false,
  searchOpen: false,
  settingsOpen: false,
  lastJob: "",
  chip: true,
  fileSeal: false,
  pinSeal: false,
  breakpoints: {},
  gitHead: seedFiles(),
  gitLog: [],
  workbenchSide: "explorer",
  hostChatOpen: true,
  debugRunning: false,
  extraExt: [],
  dap: null,
  indexSnap: null,
  gitNative: false,
  fathom: null,
  lints: [],
  nodeRuntime: null,
  setDraft: (draft) => set({ draft }),
  grant: () =>
    set({
      granted: true,
      status: "Project granted. Spectral HX will assign work without asking at every step.",
    }),
  setBusy: (busy) =>
    set({
      busy,
      status: busy ? "Spectral HX is delegating the job." : get().status,
      progress: computeProgress(busy, get().traces, get().tests),
    }),
  setStatus: (status) => set({ status }),
  setOwnerReady: (ownerReady) => set({ ownerReady, needKey: !ownerReady && !get().visitorKey }),
  setVisitorKey: (key) => {
    saveVisitorKey(key);
    set({ visitorKey: key, needKey: !key && !get().ownerReady });
  },
  setChatProvider: (next) => {
    saveProvider(next);
    set({
      providerId: next.id,
      baseUrl: next.baseUrl,
      model: next.model,
      visitorKey: next.key,
      needKey: !next.key && !get().ownerReady,
    });
  },
  setNeedKey: (needKey) => set({ needKey }),
  setObserve: (observe) => set({ observe }),
  pushVerbose: (text) =>
    set({
      verbose: [...get().verbose, { id: crypto.randomUUID(), text, at: Date.now() }].slice(-80),
    }),
  approveSoftware: (name) => {
    const clean = name.trim().toLowerCase();
    if (!clean) return;
    if (get().software.includes(clean)) return;
    set({ software: [...get().software, clean] });
  },
  setRepo: (repo) => set({ repo }),
  addFiles: (incoming) => {
    const allowed: Record<string, string> = {};
    for (const [path, content] of Object.entries(incoming)) {
      if (pathAllowed(path, get().allowlist) || get().files[path] !== undefined) allowed[path] = content;
    }
    const files = { ...get().files, ...allowed };
    const tests = runWorkspaceTests(files);
    set({ files, tests, progress: computeProgress(get().busy, get().traces, tests) });
  },
  planTasks: (prompt, mode) => {
    const incoming = planJob(prompt, mode);
    const tasks = get().hxOpen
      ? [...get().tasks.filter((t) => t.status === "queued" || t.status === "assigned" || t.status === "active"), ...incoming]
      : incoming;
    set({ tasks });
    publishLive({ type: "tasks", tasks, busy: get().busy, job: prompt });
  },
  spawnLane: (role, title) => {
    const task: AgentTask = {
      id: crypto.randomUUID(),
      title,
      assignee: role,
      status: "assigned",
      crew: role === "patch" ? 4 : 2,
    };
    const tasks = [...get().tasks, task];
    set({ tasks });
    publishLive({ type: "tasks", tasks, busy: get().busy, job: title });
  },
  setTaskStatus: (id, status) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, status } : t));
    set({ tasks });
    publishLive({ type: "tasks", tasks, busy: get().busy });
  },
  openHx: () => {
    const hxDetached = openHxSoftware();
    set({ hxOpen: true, hxDetached });
    publishLive({ type: "open", tasks: get().tasks, busy: get().busy });
  },
  closeHx: () => {
    set({ hxOpen: false, hxDetached: false });
    publishLive({ type: "close" });
  },
  pushMessage: (msg) => set({ messages: [...get().messages, msg] }),
  applyAgentFiles: (incoming) => {
    if (!incoming || Object.keys(incoming).length === 0) return;
    const files = { ...get().files };
    for (const [path, content] of Object.entries(incoming)) {
      if (pathAllowed(path, get().allowlist) || files[path] !== undefined) files[path] = content;
    }
    const tests = runWorkspaceTests(files);
    const first = Object.keys(incoming).find((p) => !/HASHES|KNOTS/.test(p));
    const tabs =
      first && !get().openTabs.includes(first) ? [...get().openTabs, first].slice(-8) : get().openTabs;
    const snap = silentIndex(files);
    set({
      files,
      tests,
      lints: diagnostics(files),
      indexSnap: { ready: snap.ready, files: snap.files, chunks: snap.chunks, edges: snap.edges, ms: snap.ms },
      progress: computeProgress(get().busy, get().traces, tests),
      openTabs: tabs,
    });
  },
  setTraces: (traces) => {
    const tasks = advanceTasks(get().tasks, traces);
    set({
      traces,
      tasks,
      progress: computeProgress(get().busy, traces, get().tests),
    });
    publishLive({ type: "tasks", tasks, busy: get().busy });
  },
  hydrateMemory: (memory) =>
    set({ memory, visitorKey: loadVisitorKey(), updates: loadUpdateSettings() }),
  hydrateChrome: () => {
    const theme = loadTheme();
    applyTheme(theme);
    const bench = loadBench();
    const provider = loadProvider();
    const os = resolveImmutablePlatform();
    const host = loadHost(os);
    applyHost(host);
    set({
      platform: os,
      host,
      theme,
      spendCap: bench.spendCap,
      allowlist: bench.allowlist,
      providerId: provider.id,
      baseUrl: provider.baseUrl,
      model: provider.model,
      visitorKey: provider.key || loadVisitorKey(),
    });
  },
  setHost: (patch) => {
    const host = saveHost({ ...get().host, ...patch, os: get().platform });
    applyHost(host);
    set({ host });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setRailOpen: (railOpen) => set({ railOpen }),
  toggleSandbox: () => {
    const on = !get().sandbox;
    if (on) {
      set({
        sandbox: true,
        sandboxSnap: { ...get().files },
        status: "Sandbox on. Writes stay isolated until you leave it.",
      });
    } else {
      set({
        sandbox: false,
        files: get().sandboxSnap ?? get().files,
        sandboxSnap: null,
        tests: runWorkspaceTests(get().sandboxSnap ?? get().files),
        status: "Sandbox closed. Restored the last safe snapshot.",
      });
    }
  },
  openSandbox: async () => {
    if (!get().sandbox) get().toggleSandbox();
    const vol = await packFiles(get().files);
    await saveVolume(vol);
    const popped = openSandboxWindow();
    set({
      packStats: statsOf(vol),
      sandboxOverlay: !popped,
      status: popped ? "LIVE sandbox popped out." : "LIVE sandbox overlay (popup blocked).",
    });
    get().pushTerm(`LIVE GeoPack ${statsOf(vol).unique} chunks, ${(statsOf(vol).ratio * 100).toFixed(0)}% of raw`);
  },
  closeSandbox: () => set({ sandboxOverlay: false }),
  addLibrary: (project) => {
    if (get().library.some((p) => p.id === project.id)) return;
    set({ library: [...get().library, project] });
  },
  setPlan: (plan) => set({ plan }),
  setTodos: (todos) => set({ todos }),
  setDiffs: (diffs) => set({ diffs }),
  setSessionMode: (sessionMode) => set({ sessionMode }),
  setSurface: (surface) => set({ surface }),
  remember: (lesson) =>
    set({
      memory: {
        ...get().memory,
        lessons: mergeLessons(get().memory.lessons, [lesson]),
        lastReview: Date.now(),
      },
    }),
  reviewMemory: (traces) => {
    const tests = get().tests;
    const pass = tests.length ? tests.every((t) => t.pass) : null;
    const lesson = lessonFromTurn(traces, pass);
    if (!lesson) return;
    set({
      memory: {
        ...get().memory,
        lessons: mergeLessons(get().memory.lessons, [lesson]),
        lastReview: Date.now(),
      },
      pinSeal: true,
    });
  },
  setUpdatePolicy: (policy) => {
    const updates = persistUpdates({ ...get().updates, policy });
    set({ updates });
  },
  setInstallHour: (hour) => {
    const installHour = Math.max(0, Math.min(23, hour));
    const updates = persistUpdates({ ...get().updates, installHour });
    set({ updates });
  },
  queueDailyUpdate: () => {
    const failing = get().tests.filter((t) => !t.pass).length;
    const pending = buildDailyUpdate({
      fileCount: Object.keys(get().files).length,
      failing,
      lessons: get().memory.lessons,
    });
    const updates = persistUpdates({
      ...get().updates,
      pending,
      lastBuildDay: todayStamp(),
    });
    set({ updates, status: "Daily improvement build is ready for approval." });
    void fetchHostUpdates().then((feed) => {
      const remote = feed?.releases[0];
      if (!remote) return;
      const cur = get().updates.pending;
      if (!cur) return;
      persistUpdates({
        ...get().updates,
        pending: {
          ...cur,
          summary: remote.summary,
          lessons: mergeLessons(cur.lessons, remote.lessons),
        },
      });
    });
  },
  approveUpdate: () => {
    const pending = get().updates.pending;
    if (!pending) return;
    set({
      memory: {
        ...get().memory,
        lessons: mergeLessons(get().memory.lessons, pending.lessons),
        lastReview: Date.now(),
      },
      updates: persistUpdates({
        ...get().updates,
        pending: null,
        lastInstallDay: todayStamp(),
      }),
      status: "Improvement build installed.",
    });
  },
  dismissUpdate: () => {
    const updates = persistUpdates({ ...get().updates, pending: null });
    set({ updates });
  },
  maybeSilentInstall: () => {
    const { updates } = get();
    if (updates.policy !== "silent" || !updates.pending) return;
    if (new Date().getHours() !== updates.installHour) return;
    if (updates.lastInstallDay === todayStamp()) return;
    get().approveUpdate();
    get().pushVerbose(`Silent install ran at ${String(updates.installHour).padStart(2, "0")}:00.`);
  },
  openPath: (path) => {
    const tabs = get().openTabs.includes(path) ? get().openTabs : [...get().openTabs, path].slice(-8);
    set({ activePath: path, openTabs: tabs });
  },
  closeTab: (path) => {
    const tabs = get().openTabs.filter((t) => t !== path);
    const activePath = get().activePath === path ? (tabs[0] ?? "demo/main.py") : get().activePath;
    set({ openTabs: tabs, activePath });
  },
  writeActive: (content) => {
    const path = get().activePath;
    if (!path) return;
    if (!pathAllowed(path, get().allowlist) && get().files[path] === undefined) return;
    set({
      files: { ...get().files, [path]: content },
      dirty: { ...get().dirty, [path]: true },
    });
  },
  createFile: (path, content = "") => {
    const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!clean || clean.includes("..")) return;
    if (get().files[clean] !== undefined) {
      get().openPath(clean);
      return;
    }
    const prefix = clean.split("/")[0] ?? "";
    const known = Object.keys(get().files).some((p) => p === prefix || p.startsWith(prefix + "/"));
    if (!known && !pathAllowed(clean, get().allowlist)) get().addAllow(prefix || clean);
    const files = { ...get().files, [clean]: content };
    set({ files, dirty: { ...get().dirty, [clean]: true } });
    get().openPath(clean);
    get().pushTerm(`LIVE created ${clean}`);
  },
  deleteFile: (path) => {
    if (get().files[path] === undefined) return;
    const files = { ...get().files };
    delete files[path];
    const dirty = { ...get().dirty };
    delete dirty[path];
    set({ files, dirty, tests: runWorkspaceTests(files) });
    get().closeTab(path);
    get().pushTerm(`LIVE deleted ${path}`);
  },
  saveActive: () => {
    get().runChecks();
    const path = get().activePath;
    const dirty = { ...get().dirty };
    delete dirty[path];
    set({ dirty, status: `Saved ${path}` });
    get().pushTerm(`LIVE saved ${path}`);
  },
  setCursor: (cursorLine, cursorCol) => set({ cursorLine, cursorCol }),
  setBottomPane: (bottomPane) => set({ bottomPane }),
  toggleBreakpoint: (path, line) => {
    const cur = get().breakpoints[path] ?? [];
    const next = cur.includes(line) ? cur.filter((n) => n !== line) : [...cur, line].sort((a, b) => a - b);
    set({ breakpoints: { ...get().breakpoints, [path]: next } });
  },
  gitCommit: (message) => {
    const files = { ...get().files };
    const changed = gitStatus(get().gitHead, files).length;
    if (!changed) {
      get().pushTerm("Git: nothing to commit");
      return;
    }
    const commit = { id: newCommitId(), message: message.trim() || "workspace", at: Date.now(), files: changed };
    set({ gitHead: files, gitLog: [commit, ...get().gitLog].slice(0, 40) });
    get().pushTerm(`LIVE git commit ${commit.id} — ${commit.files} file(s)`);
  },
  setWorkbenchSide: (workbenchSide) => set({ workbenchSide }),
  setHostChatOpen: (hostChatOpen) => set({ hostChatOpen }),
  setDebugRunning: (debugRunning) => {
    if (debugRunning) get().startDap();
    else set({ debugRunning: false, dap: get().dap ? { ...get().dap!, stopped: false, reason: "stopped" } : null, bottomPane: "debug" });
  },
  startDap: () => {
    const files = get().files;
    const session = workspaceLaunch(files, get().breakpoints, get().tests);
    session.adapter = pickAdapter(get().activePath);
    get().runChecks();
    set({ debugRunning: true, dap: session, bottomPane: "debug" });
    get().pushTerm(`LIVE DAP ${session.adapter} · ${session.reason}`);
  },
  dapStep: (kind) => {
    const cur = get().dap;
    if (!cur) return;
    const next = kind === "continue" ? dapContinue(cur) : dapNext(cur);
    set({ dap: next, debugRunning: next.stopped || kind === "continue" });
    get().pushTerm(`DAP ${kind}`);
  },
  runSilentIndex: () => {
    const snap = silentIndex(get().files);
    set({ indexSnap: { ready: snap.ready, files: snap.files, chunks: snap.chunks, edges: snap.edges, ms: snap.ms } });
  },
  bootHost: () => {
    const snap = silentIndex(get().files);
    set({
      indexSnap: { ready: snap.ready, files: snap.files, chunks: snap.chunks, edges: snap.edges, ms: snap.ms },
      lints: diagnostics(get().files),
    });
    void fathomAssure(get().files).then((report) => {
      set({ fathom: report });
      get().pushTerm(
        `LIVE Fathom ${report.score.pct}% · WASM ${report.wasm.ready ? report.wasm.engine : "STUB"} · ${report.wasm.bytes}B`,
      );
    });
    get().refreshNode();
  },
  installExtension: (id) => {
    if (get().extraExt.includes(id)) return;
    set({ extraExt: [...get().extraExt, id] });
    get().pushTerm(`LIVE extension ${id}`);
  },
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  runTerm: (line) => {
    const raw = line.trim();
    if (!raw) return;
    get().pushTerm(`$ ${raw}`);
    const files = get().files;
    const [cmd, ...rest] = raw.split(/\s+/);
    const arg = rest.join(" ");
    if (cmd === "ls") {
      const prefix = arg || "";
      const paths = Object.keys(files)
        .filter((p) => !prefix || p.startsWith(prefix))
        .slice(0, 40);
      paths.forEach((p) => get().pushTerm(p));
      get().pushTerm(`LIVE ${paths.length} paths`);
      return;
    }
    if (cmd === "cat" && arg && files[arg] !== undefined) {
      files[arg].split("\n").slice(0, 40).forEach((l) => get().pushTerm(l));
      return;
    }
    if (cmd === "grep" && rest[0]) {
      const needle = rest[0].toLowerCase();
      let n = 0;
      for (const [path, content] of Object.entries(files)) {
        content.split("\n").forEach((text, i) => {
          if (n >= 30) return;
          if (text.toLowerCase().includes(needle)) {
            get().pushTerm(`${path}:${i + 1}: ${text.trim().slice(0, 100)}`);
            n += 1;
          }
        });
      }
      get().pushTerm(`LIVE grep ${n} hits`);
      return;
    }
    if (cmd === "test" || cmd === "checks") {
      get().runChecks();
      return;
    }
    if (cmd === "help") {
      get().pushTerm("ls [prefix] · cat <path> · grep <text> · test · node -v · nvm/fnm/volta · help");
      return;
    }
    if (cmd === "node" && (rest[0] === "-v" || rest[0] === "--version" || !rest[0])) {
      void nodeRuntimeStatus().then((n) => {
        set({ nodeRuntime: n });
        get().pushTerm(`LIVE ${n.tool} Node ${n.current || "none"}`);
      });
      return;
    }
    if (cmd === "nvm" || cmd === "fnm" || cmd === "volta") {
      const sub = rest[0] || "ls";
      const ver = rest[1] || pinnedNode(files) || "22";
      if (sub === "ls" || sub === "list" || sub === "current") {
        void nodeRuntimeStatus().then((n) => {
          set({ nodeRuntime: n });
          get().pushTerm(`LIVE ${n.tool} ${n.current} · ${n.versions.join(" ")}`);
        });
        return;
      }
      if (sub === "use" || sub === "install" || sub === "pin") {
        get().pushTerm(`LIVE ${cmd} ${sub} ${ver}…`);
        get().useNode(ver);
        return;
      }
      get().pushTerm(`${cmd} ls | ${cmd} use <ver> | ${cmd} install <ver>`);
      return;
    }
    get().pushTerm("STUB host command — workspace shell only understands ls, cat, grep, test, node, nvm, fnm, volta.");
  },
  setPhase: (phase) => set({ phase }),
  setSpendCap: (cap) => {
    const spendCap = Math.max(1, Math.min(200, cap));
    saveBench({ spendCap, allowlist: get().allowlist });
    set({ spendCap });
  },
  addAllow: (path) => {
    const clean = path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
    if (!clean || clean.includes("..")) return;
    if (get().allowlist.includes(clean)) return;
    const allowlist = [...get().allowlist, clean];
    saveBench({ spendCap: get().spendCap, allowlist });
    set({ allowlist });
  },
  pushTerm: (line) => set({ termLines: [...get().termLines, line].slice(-80) }),
  takeCheckpoint: () => set({ checkpoint: { ...get().files } }),
  undoApply: () => {
    const snap = get().checkpoint;
    if (!snap) return;
    set({
      files: snap,
      tests: runWorkspaceTests(snap),
      diffs: [],
      phase: "idle",
      status: "Undo restored the last checkpoint.",
    });
  },
  sealHashes: (hashes) => set({ hashes: { ...get().hashes, ...hashes }, fileSeal: Object.keys(hashes).length > 0 }),
  addSpend: (n) => {
    if (get().spend + n > get().spendCap) return false;
    set({ spend: get().spend + n });
    return true;
  },
  markChip: (chip) => set({ chip }),
  setLastJob: (lastJob) => set({ lastJob }),
  runChecks: () => {
    const tests = runWorkspaceTests(get().files);
    set({
      tests,
      lints: diagnostics(get().files),
      chip: tests.length > 0 && tests.every((t) => t.pass),
      termLines: [
        ...get().termLines,
        `LIVE checks ${tests.filter((t) => t.pass).length}/${tests.length}`,
      ].slice(-80),
    });
  },
  formatActive: () => {
    const path = get().activePath;
    const text = get().files[path];
    if (text === undefined) return;
    get().writeActive(formatFile(path, text));
    get().saveActive();
    set({ lints: diagnostics(get().files) });
  },
  refreshNode: () => {
    void nodeRuntimeStatus().then((nodeRuntime) => {
      const pin = pinnedNode(get().files);
      set({ nodeRuntime: pin ? { ...nodeRuntime, pin } : nodeRuntime });
      get().pushTerm(`LIVE Node ${nodeRuntime.current || "none"} (${nodeRuntime.tool})`);
    });
  },
  useNode: (version) => {
    void nodeRuntimeUse({ data: version }).then((n) => {
      set({ nodeRuntime: n });
      get().pushTerm(n.log ? `LIVE Node ${n.current} · ${n.log}` : `LIVE Node ${n.current}`);
    });
  },
  resetWorkspace: () => {
    const files = seedFiles();
    set({
      files,
      tests: runWorkspaceTests(files),
      traces: [],
      messages: [welcome],
      granted: false,
      repo: "",
      tasks: [],
      todos: [],
      diffs: [],
      plan: "",
      status: "Workspace reset. Project grant is required again.",
      draft: "",
      progress: 0,
    });
  },
}));

export type { ForgeMode, PendingUpdate };
