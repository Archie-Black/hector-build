import { osFamily, type HostOs } from "@/lib/workspace/platform";

const KEY = "hector-host-settings-v1";

export type HostSettings = {
  os: HostOs;
  verbose: boolean;
  ghosts: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  fontScale: number;
  keyboard: "auto" | "desktop" | "touch";
  autoStart: boolean;
};

export function defaultHost(os: HostOs): HostSettings {
  const mobile = osFamily(os) === "mobile";
  return {
    os,
    verbose: false,
    ghosts: !mobile,
    notifications: true,
    reducedMotion: false,
    fontScale: mobile ? 1.12 : 1,
    keyboard: mobile ? "touch" : "desktop",
    autoStart: !mobile,
  };
}

export function loadHost(os: HostOs): HostSettings {
  const base = defaultHost(os);
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<HostSettings>;
    return {
      ...base,
      ...parsed,
      os,
      fontScale: Math.max(0.9, Math.min(1.4, Number(parsed.fontScale) || base.fontScale)),
      keyboard: parsed.keyboard === "touch" || parsed.keyboard === "desktop" || parsed.keyboard === "auto" ? parsed.keyboard : base.keyboard,
    };
  } catch {
    return base;
  }
}

export function saveHost(settings: HostSettings) {
  if (typeof window === "undefined") return settings;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
  return settings;
}

export function applyHost(settings: HostSettings) {
  if (typeof document === "undefined") return;
  const kb = settings.keyboard === "auto" ? (osFamily(settings.os) === "mobile" ? "touch" : "desktop") : settings.keyboard;
  const root = document.documentElement;
  root.dataset.os = settings.os;
  root.dataset.kb = kb;
  root.dataset.ghosts = settings.ghosts ? "on" : "off";
  root.dataset.verbose = settings.verbose ? "on" : "off";
  root.style.setProperty("--ui-scale", String(settings.fontScale));
  if (settings.reducedMotion) root.dataset.motion = "reduce";
  else delete root.dataset.motion;
}

export function installHint(os: HostOs) {
  if (os === "windows") {
    return {
      path: "%LOCALAPPDATA%\\HectorBuild",
      how: "Unzip the GitHub source. Run packaging\\windows\\Install.bat. That embeds WSL Ubuntu for Linux tools. Node 22 + Electron stay Windows. SmartScreen: More info → Run anyway.",
    };
  }
  if (os === "linux") {
    return {
      path: "~/.local/share/hector-build",
      how: "bash packaging/linux/install.sh then bash packaging/linux/configure.sh. Commands: hector-build and spectral-hx.",
    };
  }
  if (os === "macos") {
    return {
      path: "~/Library/Application Support/HectorBuild",
      how: "Node 22, then npm install && npm run desktop. Same desktop shell as Linux.",
    };
  }
  if (os === "android") {
    return {
      path: "Home screen / PWA",
      how: "Chrome → menu → Add to Home screen. Full-screen Hector. Spectral HX uses the same chat; files stay in the browser workspace.",
    };
  }
  return {
    path: "Home screen / PWA",
    how: "Safari Share → Add to Home Screen. Keep the display awake while a build runs.",
  };
}
