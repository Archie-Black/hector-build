import { knotSeal } from "@/lib/geometry/braid";

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashFiles(files: Record<string, string>, paths: string[]) {
  const out: Record<string, string> = {};
  for (const path of paths) {
    if (files[path] === undefined) continue;
    out[path] = await sha256(files[path]);
  }
  return out;
}

export function knotSeals(files: Record<string, string>, paths: string[]) {
  const lines = ["# Knot seals", "", "Artin-reduced braid + Burau determinant (t = -1) + Gauss prefix.", ""];
  for (const path of paths) {
    if (files[path] === undefined) continue;
    const s = knotSeal(files[path]);
    lines.push(
      `- \`${path}\` writhe ${s.writhe} det ${s.det} reduced ${s.reduced}/${s.crossings} 3-color ${s.color3} perm ${s.perm}`,
    );
  }
  return lines.join("\n") + "\n";
}
