export type Hat = "none" | "fedora" | "toque";

export type Skin = {
  name: string;
  hue: number;
  hat: Hat;
};

const STORE = "v01d.hector.skin";

export const SHOW: Skin[] = [
  { name: "Stock", hue: 0, hat: "none" },
  { name: "Cobalt", hue: 210, hat: "none" },
  { name: "Uranium", hue: 70, hat: "none" },
  { name: "Paul", hue: 20, hat: "fedora" },
  { name: "North", hue: 190, hat: "toque" },
];

export function load(): Skin {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Skin;
  } catch {
    /* first */
  }
  return { ...SHOW[0] };
}

export function save(s: Skin) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* native */
  }
  return s;
}

export function hatSrc(hat: Hat) {
  if (hat === "fedora") return "/horsemen/hat-fedora.png";
  if (hat === "toque") return "/horsemen/hat-toque.png";
  return "";
}
