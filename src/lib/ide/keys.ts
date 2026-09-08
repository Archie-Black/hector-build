export function isAppleOs() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modName() {
  return isAppleOs() ? "Cmd" : "Ctrl";
}

export function isMod(e: { metaKey: boolean; ctrlKey: boolean }) {
  return isAppleOs() ? e.metaKey : e.ctrlKey || e.metaKey;
}
