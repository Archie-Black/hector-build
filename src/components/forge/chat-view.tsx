import { useEffect } from "react";
import { LlmChat } from "@/components/forge/llm-chat";
import { useForgeStore } from "@/lib/forge-store";
import { loadMemory, saveMemory } from "@/lib/workspace/memory";
import { todayStamp } from "@/lib/workspace/updates";
import { loadMdvWasm } from "@/lib/geometry/mdv-wasm";
import { useAgentSend } from "@/lib/workspace/use-agent-send";
import { idleSpool, spoolFor } from "@/lib/spool/client";
import { bootOs } from "@/lib/os/client";
import { idleNet } from "@/lib/net/client";

export function ChatView() {
  const memory = useForgeStore((s) => s.memory);
  const draft = useForgeStore((s) => s.draft);
  const { send, error, probe } = useAgentSend("hector");

  useEffect(() => {
    const store = useForgeStore.getState();
    store.hydrateMemory(loadMemory());
    store.hydrateChrome();
    store.grant();
    void loadMdvWasm();
    void idleSpool();
    bootOs();
    idleNet();
    void probe().then((r) => useForgeStore.getState().setOwnerReady(r.ownerReady));
    if (store.updates.lastBuildDay !== todayStamp()) store.queueDailyUpdate();
    store.maybeSilentInstall();
  }, [probe]);

  useEffect(() => {
    saveMemory(memory);
  }, [memory]);

  useEffect(() => {
    if (!draft.trim()) return;
    const t = setTimeout(() => void spoolFor(draft), 180);
    return () => clearTimeout(t);
  }, [draft]);

  return (
    <LlmChat
      onSend={(t) => void send(t)}
      error={error}
      onBack={() => useForgeStore.getState().setSurface("title")}
    />
  );
}
