import { useEffect, useState } from "react";
import { HxConnect } from "@/components/hx/hx-connect";
import { HxIde } from "@/components/hx/hx-ide";
import { HxLiveWindow } from "@/components/hx/hx-live-window";
import { HxSessionFrame } from "@/components/hx/hx-session-frame";
import { subscribeLive } from "@/lib/hx/live";
import { useForgeStore } from "@/lib/forge-store";
import { loadMemory, saveMemory } from "@/lib/workspace/memory";
import { todayStamp } from "@/lib/workspace/updates";
import { loadMdvWasm } from "@/lib/geometry/mdv-wasm";
import { useAgentSend } from "@/lib/workspace/use-agent-send";

function isLiveFloor() {
  if (typeof window === "undefined") return false;
  return window.name === "spectral-hx" || new URLSearchParams(window.location.search).get("live") === "1";
}

export function HxApp() {
  const memory = useForgeStore((s) => s.memory);
  const { send, error, probe } = useAgentSend("hx");
  const [ready, setReady] = useState(false);
  const [live] = useState(isLiveFloor);

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

  useEffect(() => {
    if (!live) return;
    return subscribeLive((payload) => {
      if (payload.type === "close") return;
      if (payload.tasks) {
        useForgeStore.setState({ tasks: payload.tasks, busy: payload.busy ?? false });
      }
    });
  }, [live]);

  if (live) {
    return (
      <div className="flex h-dvh bg-bg text-fg">
        <HxLiveWindow />
      </div>
    );
  }

  if (!ready) return <HxConnect onReady={() => setReady(true)} />;

  return (
    <>
      <HxSessionFrame />
      <HxIde onSend={(t) => void send(t)} error={error} onBack={() => setReady(false)} />
    </>
  );
}
