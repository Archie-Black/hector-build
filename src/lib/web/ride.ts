/** Hector rides Punisher on the surface, Dark Horse under it. */
import { punisherFetch, punisherSearch } from "./punisher.ts";
import { darkHorseFetch, darkHorseSearch, wantsDarkHorse } from "./dark-horse.ts";

export const WEB_RIDERS = [
  { id: "punisher" as const, name: "Punisher", path: "surface", duty: "Public https. Search and fetch." },
  { id: "darkhorse" as const, name: "Dark Horse", path: "onion", duty: "Hidden services. Isolated Tor circuits." },
];

export function pickRider(raw: string, isolate = false) {
  if (isolate || wantsDarkHorse(raw)) return "darkhorse" as const;
  return "punisher" as const;
}

export async function rideSearch(query: string, isolate = false) {
  if (isolate || wantsDarkHorse(query)) {
    const horse = await darkHorseSearch(query);
    if (horse.hits.length) return horse;
  }
  const surface = await punisherSearch(query);
  if (surface.hits.length) return surface;
  return darkHorseSearch(query);
}

export async function rideFetch(url: string, isolate = false) {
  if (pickRider(url, isolate) === "darkhorse") return darkHorseFetch(url);
  const surface = await punisherFetch(url);
  if (!("error" in surface)) return surface;
  return darkHorseFetch(url);
}
