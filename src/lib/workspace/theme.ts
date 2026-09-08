export type ThemeName = "dark" | "light";

const KEY = "hector-theme-v1";

export function loadTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(KEY, theme);
}
