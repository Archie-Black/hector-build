import { detectPlatform, type LockedPlatform } from "@/lib/workspace/platform";

export type EnvScan = {
  platform: LockedPlatform;
  cores: number;
  memoryGb: number | null;
  gpu: string;
  screen: string;
  wasm: boolean;
  webgpu: boolean;
  touch: boolean;
  language: string;
  timezone: string;
  ua: string;
};

async function gpuName() {
  try {
    const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ info?: { device?: string } } | null> } };
    if (nav.gpu) {
      const ad = await nav.gpu.requestAdapter();
      const name = ad?.info?.device;
      if (name) return name;
    }
  } catch {
    /* fall through */
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return "none";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "webgl";
    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
  } catch {
    return "unknown";
  }
}

export async function scanEnvironment(): Promise<EnvScan> {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const mem = typeof navigator !== "undefined" ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined;
  return {
    platform: detectPlatform(ua),
    cores: typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 1 : 1,
    memoryGb: mem ?? null,
    gpu: typeof document === "undefined" ? "server" : await gpuName(),
    screen: typeof window === "undefined" ? "0x0" : `${window.screen.width}×${window.screen.height}`,
    wasm: typeof WebAssembly !== "undefined",
    webgpu: typeof navigator !== "undefined" && "gpu" in navigator,
    touch: typeof navigator !== "undefined" && navigator.maxTouchPoints > 0,
    language: typeof navigator !== "undefined" ? navigator.language : "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ua: ua.slice(0, 160),
  };
}

export function scanLines(scan: EnvScan) {
  return [
    `${scan.platform} · ${scan.cores} cores` + (scan.memoryGb ? ` · ${scan.memoryGb} GB` : ""),
    scan.gpu,
    scan.screen + (scan.touch ? " · touch" : ""),
    `WASM ${scan.wasm ? "yes" : "no"} · WebGPU ${scan.webgpu ? "yes" : "no"}`,
    scan.timezone,
  ];
}
