/** Four horsemen. Hector (Death) is the leader. The other three ride under him. */

export type HorsemanId = "conquest" | "war" | "famine" | "death";
export type ComputerKind = "shared" | "private" | "local" | "host";

export type Horseman = {
  id: HorsemanId;
  name: string;
  title: string;
  lineage: string;
  computer: ComputerKind;
  lead: boolean;
  duty: string;
};

export const HECTOR_ID: HorsemanId = "death";

export const HORSEMEN: Horseman[] = [
  {
    id: "conquest",
    name: "Conquest",
    title: "Persistent teammate",
    lineage: "Rakazo",
    computer: "shared",
    lead: false,
    duty: "Keep identity, memory, routines, and the shared computer alive across turns.",
  },
  {
    id: "war",
    name: "War",
    title: "Gateway and isolation",
    lineage: "OpenBot",
    computer: "private",
    lead: false,
    duty: "Fail-closed policy. Audit first. No action without the record.",
  },
  {
    id: "famine",
    name: "Famine",
    title: "Local roster",
    lineage: "OpenMausBot",
    computer: "local",
    lead: false,
    duty: "Local-first chat. Allow/deny cards. One-hop ask, never a chain.",
  },
  {
    id: "death",
    name: "Hector",
    title: "Host intelligence",
    lineage: "Hector Build",
    computer: "host",
    lead: true,
    duty: "Lead the four. Speak to the user. Delegate. Fold every answer into one voice.",
  },
];

export function lead() {
  return HORSEMEN.find((h) => h.lead)!;
}

export function rider(id: string) {
  return HORSEMEN.find((h) => h.id === id) ?? lead();
}

export function listRiders() {
  return HORSEMEN;
}
