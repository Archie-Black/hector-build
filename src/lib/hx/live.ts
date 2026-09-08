import type { AgentTask } from "@/lib/workspace/team";

export const HX_LIVE = "spectral-hx-live";

export type HxLivePayload = {
  type: "tasks" | "close" | "open";
  tasks?: AgentTask[];
  busy?: boolean;
  job?: string;
};

export function publishLive(payload: HxLivePayload) {
  if (typeof window === "undefined") return;
  try {
    const ch = new BroadcastChannel(HX_LIVE);
    ch.postMessage(payload);
    ch.close();
  } catch {
    /* preview hosts can lack BroadcastChannel */
  }
}

export function subscribeLive(fn: (payload: HxLivePayload) => void) {
  if (typeof window === "undefined") return () => undefined;
  try {
    const ch = new BroadcastChannel(HX_LIVE);
    ch.onmessage = (e) => fn(e.data as HxLivePayload);
    return () => ch.close();
  } catch {
    return () => undefined;
  }
}

export function openHxSoftware() {
  if (typeof window === "undefined") return false;
  try {
    const popup = window.open(
      "/hx?live=1",
      "spectral-hx",
      "popup=yes,width=1100,height=800,left=72,top=48,menubar=no,toolbar=no,location=no,status=no",
    );
    return Boolean(popup && !popup.closed);
  } catch {
    return false;
  }
}

export function openSandboxWindow() {
  if (typeof window === "undefined") return false;
  try {
    const popup = window.open(
      "/sandbox",
      "hx-sandbox",
      "popup=yes,width=1100,height=780,left=96,top=64,menubar=no,toolbar=no,location=no,status=no",
    );
    return Boolean(popup && !popup.closed);
  } catch {
    return false;
  }
}

export function openHectorSoftware() {
  if (typeof window === "undefined") return false;
  try {
    const popup = window.open(
      "/?house=1",
      "hector-build",
      "popup=yes,width=1280,height=860,left=24,top=24,menubar=no,toolbar=no,location=no,status=no",
    );
    return Boolean(popup && !popup.closed);
  } catch {
    return false;
  }
}

