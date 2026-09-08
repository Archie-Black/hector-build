import { densityReport, expandSeed, packKnots } from "./knot";

export async function compareDensity(files: Record<string, string>) {
  const vol = packKnots(files);
  const joined = Object.values(files).join("");
  let gzip = joined.length;
  if (typeof CompressionStream !== "undefined") {
    const buf = await new Response(
      new Blob([joined]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer();
    gzip = buf.byteLength;
  }
  const seed = Object.keys(files).slice(0, 3).join("|") || "hx";
  const expanded = expandSeed(seed, 8).length;
  const random = Array.from({ length: Math.min(4000, Math.max(200, joined.length)) }, (_, i) =>
    String.fromCharCode(33 + ((i * 47) % 90)),
  ).join("");
  const randomVol = packKnots({ "random.txt": random });
  return {
    structured: densityReport(vol, expanded),
    gzip,
    random: densityReport(randomVol, random.length),
    seed,
  };
}