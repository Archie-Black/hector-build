export type ForgeMode = "scout" | "plan" | "patch" | "swarm";

export type WorkspaceFile = {
  path: string;
  content: string;
};

export type WorkspaceSnapshot = {
  files: Record<string, string>;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatSpeaker = "hector" | "hx" | "you";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  mode?: ForgeMode;
  speaker?: ChatSpeaker;
};

export type ToolTrace = {
  name: string;
  ok: boolean;
  detail: string;
};

export type TestResult = {
  name: string;
  pass: boolean;
  detail: string;
};

export type AgentTodo = {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "done";
};

export type FileDiff = {
  path: string;
  before: string;
  after: string;
};

export type AgentResponse = {
  ok: boolean;
  error?: string;
  needKey?: boolean;
  reply: string;
  files: Record<string, string>;
  traces: ToolTrace[];
  tests?: TestResult[];
  plan?: string;
  todos?: AgentTodo[];
  diffs?: FileDiff[];
};
