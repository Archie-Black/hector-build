import { useEffect } from "react";
import { LlmChat } from "@/components/forge/llm-chat";
import { useForgeStore } from "@/lib/forge-store";
import { loadMemory, saveMemory } from "@/lib/workspace/memory";
import { todayStamp } from "@/lib/workspace/updates";
import { loadMdvWasm } from "@/lib/geometry/mdv-wasm";
import { useAgentSend } from "@/lib/workspace/use-agent-send";

export function ChatView() {
  const memory = useForgeStore((s) => s.memory);
  const { send, error, probe } = useAgentSend("hector");

  useEffect(() => {
    const store = useForgeStore.getState();
    store.hydrateMemory(loadMemory());
    store.hydrateChrome();
    store.grant();
    void loadMdvWasm();
    void probe().then((r) => useForgeStore.getState().setOwnerReady(r.ownerReady));
    if (store.updates.lastBuildDay !== todayStamp()) store.queueDailyUpdate();
    store.maybeSilentInstall();
  }, [probe]);

  useEffect(() => {
    saveMemory(memory);
  }, [memory]);

  return (
    <LlmChat
      onSend={(t) => void send(t)}
      error={error}
      onBack={() => useForgeStore.getState().setSurface("title")}
    />
  );
}
