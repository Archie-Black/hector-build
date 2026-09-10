export type XrKind = "immersive-vr" | "immersive-ar" | "inline";
export type ImmersivePref = "glass" | "room" | "headset";

export type XrCaps = {
  xr: boolean;
  vr: boolean;
  ar: boolean;
  inline: boolean;
};

const KEY = "hector.immersive";

export function loadImmersive(): ImmersivePref {
  if (typeof localStorage === "undefined") return "glass";
  const v = localStorage.getItem(KEY);
  if (v === "room" || v === "headset" || v === "glass") return v;
  return "glass";
}

export function saveImmersive(pref: ImmersivePref) {
  localStorage.setItem(KEY, pref);
  window.dispatchEvent(new CustomEvent("hector-immersive", { detail: pref }));
}

export function xrSystem(): XRSystem | null {
  if (typeof navigator === "undefined") return null;
  return navigator.xr ?? null;
}

export async function probeXr(): Promise<XrCaps> {
  const xr = xrSystem();
  if (!xr?.isSessionSupported) return { xr: false, vr: false, ar: false, inline: false };
  const [vr, ar, inline] = await Promise.all([
    xr.isSessionSupported("immersive-vr").catch(() => false),
    xr.isSessionSupported("immersive-ar").catch(() => false),
    xr.isSessionSupported("inline").catch(() => false),
  ]);
  return { xr: true, vr: Boolean(vr), ar: Boolean(ar), inline: Boolean(inline) };
}

export function pickSession(caps: XrCaps, pref: ImmersivePref): XrKind | null {
  if (pref === "glass") return null;
  if (pref === "headset") {
    if (caps.vr) return "immersive-vr";
    if (caps.ar) return "immersive-ar";
    return caps.inline ? "inline" : null;
  }
  return "inline";
}

export function sessionInit(kind: XrKind, overlay?: HTMLElement | null): XRSessionInit {
  if (kind === "immersive-ar") {
    const init: XRSessionInit = {
      requiredFeatures: [],
      optionalFeatures: ["hit-test", "light-estimation", "anchors", "local-floor", "hand-tracking", "dom-overlay"],
    };
    if (overlay) init.domOverlay = { root: overlay };
    return init;
  }
  if (kind === "immersive-vr") {
    return { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "layers"] };
  }
  return {};
}
