/** House downloads. Hector Build, Spectral HX, OS images. www.doomchat.ca. */

import { CHARTER } from "./charter";

export const MIRROR = Object.freeze({
  house: CHARTER.house,
  www: CHARTER.www,
  y: CHARTER.doomchat,
  downloads: CHARTER.downloads,
  community: CHARTER.community,
  /** Punisher local tree. Same files as packaging/linux. */
  punisher: "C:\\Users\\Dark0\\Downloads\\OSV01D\\hector-build",
  punisherLinux: "C:\\Users\\Dark0\\Downloads\\OSV01D\\hector-build-main\\packaging\\linux",
});

export type ImageKind = "tree" | "ide" | "iso" | "usb" | "community";

export type Image = {
  id: string;
  name: string;
  blurb: string;
  kind: ImageKind;
  file: string;
  url: string;
  local: string;
};

function at(file: string) {
  return `${MIRROR.downloads.replace(/\/$/, "")}/${file}`;
}

export const IMAGES: Image[] = [
  {
    id: "hector-build",
    name: "Hector Build",
    blurb: "The OS V01D tree. packaging/linux is the install foundation.",
    kind: "tree",
    file: "hector-build.tar.gz",
    url: at("hector-build.tar.gz"),
    local: `${MIRROR.punisher}\\hector-build.tar.gz`,
  },
  {
    id: "spectral-hx",
    name: "Spectral HX",
    blurb: "Coding IDE. Ghosts. Git. Terminal. Opens when Hector delegates.",
    kind: "ide",
    file: "spectral-hx.tar.gz",
    url: at("spectral-hx.tar.gz"),
    local: `${MIRROR.punisher}\\spectral-hx.tar.gz`,
  },
  {
    id: "os-iso",
    name: "OS V01D ISO",
    blurb: "USB or net boot. No loader menu. Intro, then install.",
    kind: "iso",
    file: "osv01d.iso",
    url: at("osv01d.iso"),
    local: `${MIRROR.punisher}\\osv01d.iso`,
  },
  {
    id: "os-usb",
    name: "OS V01D USB image",
    blurb: "Raw disk image. dd to a stick. Firmware first.",
    kind: "usb",
    file: "osv01d.img.xz",
    url: at("osv01d.img.xz"),
    local: `${MIRROR.punisher}\\osv01d.img.xz`,
  },
  {
    id: "community",
    name: "Community downloads",
    blurb: "Mods and extras. Spectre only. Never cash.",
    kind: "community",
    file: "",
    url: MIRROR.community,
    local: `${MIRROR.punisher}\\community`,
  },
];

export function image(id: string) {
  return IMAGES.find((i) => i.id === id || i.file === id || i.name.toLowerCase() === id.toLowerCase());
}

export function fetchCmd(id: string) {
  const hit = image(id) || IMAGES[0]!;
  return ["curl", "-fL", "--retry", "3", "-o", hit.file || "index.html", hit.url];
}

export function wantsDownloads(text: string) {
  return /\b(download|iso|usb image|hector build|spectral hx image|os image|community downloads)\b/i.test(text) && /\b(doomchat|hector|os v01d|osv01d|www\.doomchat|image|iso|usb)\b/i.test(text);
}

export function sayDownloads() {
  return `Downloads live at ${MIRROR.downloads} Same files on the Punisher mirror. Hector Build, Spectral HX, OS images.`;
}
