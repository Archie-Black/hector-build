/** Every Mach / Mac translation Hector needs in the app and in production. */

export type MapKind = "right" | "hid" | "glass" | "sysctl" | "launchd" | "app" | "prod";

export type Translation = {
  kind: MapKind;
  from: string;
  to: string;
  note: string;
};

export const MACH_RIGHTS: Translation[] = [
  { kind: "right", from: "MACH_PORT_RIGHT_RECEIVE", to: "receive", note: "one in the system; dequeue; mint send" },
  { kind: "right", from: "MACH_PORT_RIGHT_SEND", to: "send", note: "copyable; enqueue" },
  { kind: "right", from: "MACH_PORT_RIGHT_SEND_ONCE", to: "send-once", note: "move only; one message; dead name" },
  { kind: "right", from: "MACH_PORT_RIGHT_PORT_SET", to: "port-set", note: "sleep on several, wake on one" },
  { kind: "right", from: "MACH_PORT_RIGHT_DEAD_NAME", to: "dead", note: "tombstone, not a capability" },
  { kind: "right", from: "MACH_MSG_TYPE_COPY_SEND", to: "copy-send", note: "clone send into the message" },
  { kind: "right", from: "MACH_MSG_TYPE_MOVE_SEND", to: "move-send", note: "sender loses the send right" },
  { kind: "right", from: "MACH_MSG_TYPE_MOVE_SEND_ONCE", to: "move-send-once", note: "reply port" },
  { kind: "right", from: "MACH_MSG_TYPE_MOVE_RECEIVE", to: "move-receive", note: "queue changes owner" },
  { kind: "right", from: "MACH_MSG_TYPE_MAKE_SEND", to: "make-send", note: "receive holder mints a send" },
  { kind: "right", from: "host_t", to: "com.hector.host", note: "unprivileged host info" },
  { kind: "right", from: "host_priv_t", to: "com.hector.host-priv", note: "Hector only. task_for_pid." },
  { kind: "right", from: "mach_task_self", to: "task.<id>", note: "own VM, not someone else's" },
  { kind: "right", from: "bootstrap_port", to: "com.hector.darwin.webconnect", note: "launchd directory" },
  { kind: "right", from: "task_for_pid", to: "host-priv send", note: "HX is denied. Hector is allowed." },
  { kind: "right", from: "mach_vm_allocate", to: "task-self", note: "named memory object" },
  { kind: "right", from: "ipc_space name", to: "knot+local name", note: "stolen name without knot is invalid" },
];

export const HID_MAP: Translation[] = [
  { kind: "hid", from: "Control", to: "Command", note: "PC Ctrl is Mac ⌘" },
  { kind: "hid", from: "Alt", to: "Option", note: "PC Alt is Mac ⌥" },
  { kind: "hid", from: "Meta/Win", to: "Control", note: "PC Super is Mac Control" },
  { kind: "hid", from: "Ctrl+Shift+\\", to: "⌘⇧\\", note: "KVM cycle" },
  { kind: "hid", from: "usb-tablet", to: "absolute pointer", note: "Mac-like, no grab-trap" },
];

export const GLASS_MAP: Translation[] = [
  { kind: "glass", from: "Cinema Display 30″", to: "2560×1600", note: "16:10 notorious Mac" },
  { kind: "glass", from: "Retina 13″", to: "2560×1600 @2x", note: "logical 1280×800" },
  { kind: "glass", from: "Quartz backing", to: "scale 2", note: "HiDPI default" },
  { kind: "glass", from: "noVNC / RFB", to: "hector-rfb/1", note: "same-origin webconnect" },
  { kind: "glass", from: "VNC :1", to: "127.0.0.1:5901", note: "guest framebuffer" },
  { kind: "glass", from: "webconnect", to: "127.0.0.1:6081", note: "launchd socket" },
];

export const SYSCTL_MAP: Translation[] = [
  { kind: "sysctl", from: "kern.ostype", to: "Darwin", note: "open Darwin, not macOS" },
  { kind: "sysctl", from: "kern.osrelease", to: "25.0.0", note: "Hector Darwin 25" },
  { kind: "sysctl", from: "kern.hostname", to: "hector-darwin.local", note: "seat name" },
];

export const LAUNCHD_MAP: Translation[] = [
  { kind: "launchd", from: "com.hector.webconnect", to: "hector-webconnect :6081", note: "KeepAlive" },
  { kind: "launchd", from: "com.hector.kvm", to: "hector-kvm --hid iokit", note: "HID switch" },
  { kind: "launchd", from: "com.spectralhx.seat", to: "spectral-hx --seat hx", note: "HX seat" },
  { kind: "launchd", from: "com.hector.keystone", to: "keystone --map", note: "Mac mapping super agent" },
  { kind: "launchd", from: "~/Library/LaunchAgents", to: "production user agents", note: "macOS host" },
];

export const APP_MAP: Translation[] = [
  { kind: "app", from: "Safari", to: "Chromium / webview", note: "in-app glass" },
  { kind: "app", from: "Terminal.app", to: "xterm seat", note: "HX terminal" },
  { kind: "app", from: "Finder", to: "workspace files", note: "granted tree" },
  { kind: "app", from: "Activity Monitor", to: "kvm_status", note: "seats and grabs" },
  { kind: "app", from: "launchctl", to: "launchd.ts", note: "bootstrap in-process" },
  { kind: "app", from: "codesign", to: "Apple Developer ID", note: "production Gatekeeper, not sandbox" },
];

export const PROD_MAP: Translation[] = [
  { kind: "prod", from: "accel linux", to: "kvm", note: "/dev/kvm" },
  { kind: "prod", from: "accel darwin", to: "hvf", note: "Apple Hypervisor" },
  { kind: "prod", from: "accel win32", to: "whpx", note: "Windows Hypervisor" },
  { kind: "prod", from: "fallback", to: "tcg", note: "always boots" },
  { kind: "prod", from: "app support", to: "~/Library/Application Support/HectorBuild", note: "macOS host path" },
  { kind: "prod", from: "electron mac", to: "electron-builder --mac dir", note: "unsigned .app for Open anyway" },
  { kind: "prod", from: "brew prefix", to: "/opt/homebrew", note: "Apple Silicon default" },
  { kind: "prod", from: "iso drop", to: "packaging/darwin/darwin.iso", note: "PureDarwin if present" },
];

export const ALL_MAP: Translation[] = [
  ...MACH_RIGHTS,
  ...HID_MAP,
  ...GLASS_MAP,
  ...SYSCTL_MAP,
  ...LAUNCHD_MAP,
  ...APP_MAP,
  ...PROD_MAP,
];

export function resolve(from: string): Translation | undefined {
  const n = from.toLowerCase();
  return ALL_MAP.find((t) => t.from.toLowerCase() === n || t.to.toLowerCase() === n);
}

export function unresolved(needed: string[]) {
  return needed.filter((n) => !resolve(n));
}

export function productionSpec() {
  return {
    object: "hector.darwin.production",
    ostype: "Darwin",
    release: "25.0.0",
    retina: "2560x1600",
    ratio: "16:10",
    webconnect: 6081,
    vnc: 5901,
    ssh: 2223,
    accel: { darwin: "hvf", linux: "kvm", win32: "whpx", fallback: "tcg" },
    appSupport: "~/Library/Application Support/HectorBuild",
    launchAgents: "~/Library/LaunchAgents",
    brew: "/opt/homebrew",
    electron: "electron-builder --mac dir",
    iso: "packaging/darwin/darwin.iso",
    hostPriv: "hector",
    keymap: "pc-ctrl = mac-command",
  };
}
