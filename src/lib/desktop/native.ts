type Desk = {
  native: boolean;
  platform: string;
  openHx: () => Promise<unknown>;
};

export function desktopApi(): Desk | null {
  if (typeof window === "undefined") return null;
  const api = (window as Window & { hxDesktop?: Desk }).hxDesktop;
  return api?.native ? api : null;
}
