/** NASA Planetary Data System. Free. Public. Not Caldera. */

export const NODES = {
  geo: "https://pds-geosciences.wustl.edu/",
  ode: "https://ode.rsl.wustl.edu/",
  odeRest: "https://oderest.rsl.wustl.edu/",
  pdsApi: "https://nasa-pds.github.io/pds-api/",
  portal: "https://pds.nasa.gov/",
  lolaNode: "http://imbrium.mit.edu/",
  lroc: "https://lroc.sese.asu.edu/",
  sbn: "https://pdssbn.astro.umd.edu/",
  naif: "https://naif.jpl.nasa.gov/",
} as const;

export type Bundle = {
  body: "luna" | "mars" | "phobos";
  name: string;
  product: string;
  note: string;
};

export const BUNDLES: Bundle[] = [
  { body: "luna", name: "LOLA GDR / SLDEM", product: "DEM", note: "LRO Release 66 as of 2026-06-15. Height for Nanite." },
  { body: "luna", name: "LROC NAC / WAC", product: "IMG", note: "Imaging Node. Polar NAC ~1 m. WAC mosaic ~100 m." },
  { body: "luna", name: "LOLA south pole 5 m DEM", product: "DEM", note: "imbrium.mit.edu high-priority sites." },
  { body: "mars", name: "MOLA MEGDR", product: "DEM", note: "PDS4 derived topography, Aug 2026." },
  { body: "mars", name: "MRO HiRISE / CTX", product: "IMG", note: "Release 78 posted 2026-09-01." },
  { body: "phobos", name: "MEX HRSC / SRC", product: "IMG", note: "Stereo DTMs ~10–20 m. Small Bodies + Imaging." },
  { body: "phobos", name: "Viking / Mariner 9", product: "IMG", note: "SBN. Coverage, not the Shatterdome." },
];

export function odeQuery(target: Bundle["body"]) {
  const t = target === "luna" ? "moon" : target === "phobos" ? "phobos" : "mars";
  return `${NODES.odeRest}?target=${t}`;
}
