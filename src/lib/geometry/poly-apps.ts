import { braidOfText, reduceBraid } from "./braid";
import { alexanderPoly } from "./alexander";
import { jonesPoly, numericSkein } from "./kauffman";

export type PolyApp = {
  id: string;
  name: string;
  builtin: boolean;
  a: number;
  b: number;
  loop: number;
};

const KEY = "hx-poly-apps-v1";

export const BUILTIN: PolyApp[] = [
  { id: "jones-num", name: "Jones (A=1 skein check)", builtin: true, a: 1, b: 1, loop: -2 },
  { id: "tl", name: "Temperley–Lieb d=-1", builtin: true, a: 1, b: 1, loop: -1 },
];

export function loadPolyApps(): PolyApp[] {
  if (typeof localStorage === "undefined") return BUILTIN;
  try {
    const raw = localStorage.getItem(KEY);
    const extra = raw ? (JSON.parse(raw) as PolyApp[]) : [];
    return [...BUILTIN, ...extra.filter((p) => !p.builtin)];
  } catch {
    return BUILTIN;
  }
}

export function savePolyApp(app: Omit<PolyApp, "builtin" | "id">) {
  const next: PolyApp = { ...app, builtin: false, id: `user-${Date.now()}` };
  const extra = loadPolyApps().filter((p) => !p.builtin);
  extra.push(next);
  localStorage.setItem(KEY, JSON.stringify(extra));
  return next;
}

export function removePolyApp(id: string) {
  const extra = loadPolyApps().filter((p) => !p.builtin && p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(extra));
}

export function runPolyApps(text: string, apps: PolyApp[]) {
  const word = reduceBraid(braidOfText(text).slice(0, 400));
  const jones = jonesPoly(word);
  const alexander = alexanderPoly(word);
  const customs = apps.map((app) => ({
    id: app.id,
    name: app.name,
    value: numericSkein(word, app.a, app.b, app.loop),
    truncated: word.length > 12,
  }));
  return { word: word.length, jones, alexander, customs };
}
