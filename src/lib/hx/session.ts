export const HX_SESSION_CHANNEL = "spectral-hx-session";

export function hxSessionId() {
  if (typeof window === "undefined") return "hx-ssr";
  const key = "spectral-hx-session-id";
  let id = window.sessionStorage.getItem(key);
  if (!id) {
    id = `hx-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, id);
  }
  return id;
}

export function yieldToDevice(): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => resolve();
    if (typeof window === "undefined") {
      finish();
      return;
    }
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => finish(), { timeout: 250 });
      return;
    }
    window.setTimeout(finish, 0);
  });
}

export function postToSession(payload: unknown) {
  if (typeof window === "undefined") return;
  const frame = document.getElementById("hx-web-session") as HTMLIFrameElement | null;
  frame?.contentWindow?.postMessage({ channel: HX_SESSION_CHANNEL, payload }, window.location.origin);
}
