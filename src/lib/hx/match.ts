/** Spectral Horizon lobby. Six to a squad. Three lanes. Walls hold. */

export const SQUAD = 6;
export const SQUADS = 10;
export const SEATS = SQUAD * SQUADS;

export type Lane = "rookie" | "field" | "apex";

export type Pilot = {
  id: string;
  name: string;
  mmr: number;
  party?: string;
};

export type Fireteam = {
  id: string;
  lane: Lane;
  seats: Pilot[];
};

export type Lobby = {
  lane: Lane;
  teams: Fireteam[];
  full: boolean;
};

export function laneOf(mmr: number): Lane {
  if (mmr < 1000) return "rookie";
  if (mmr < 2000) return "field";
  return "apex";
}

/** Strongest seat sets the lane. An elite cannot hide in a noob stack. */
export function partyLane(seats: Pilot[]): Lane {
  const top = seats.reduce((m, p) => Math.max(m, p.mmr), 0);
  return laneOf(top);
}

function take(pool: Pilot[], n: number, around: number): Pilot[] {
  const sorted = [...pool].sort((a, b) => Math.abs(a.mmr - around) - Math.abs(b.mmr - around));
  return sorted.slice(0, n);
}

export function fillTeam(seed: Pilot[], pool: Pilot[]): { team: Fireteam; rest: Pilot[] } {
  const want = Math.min(SQUAD, seed.length + pool.length);
  const need = Math.max(0, want - seed.length);
  const mean = seed.reduce((s, p) => s + p.mmr, 0) / Math.max(1, seed.length);
  const extra = take(pool, need, mean);
  const rest = pool.filter((p) => !extra.some((e) => e.id === p.id));
  const seats = seed.concat(extra).slice(0, SQUAD);
  return {
    rest,
    team: { id: seats[0]?.id ?? "empty", lane: partyLane(seats), seats },
  };
}

export function matchmake(queue: Pilot[]): Lobby | null {
  if (!queue.length) return null;
  const groups = new Map<string, Pilot[]>();
  for (const p of queue) {
    const k = p.party ?? `solo-${p.id}`;
    const g = groups.get(k) ?? [];
    if (g.length < SQUAD) g.push(p);
    groups.set(k, g);
  }
  const buckets: Record<Lane, Pilot[][]> = { rookie: [], field: [], apex: [] };
  for (const g of groups.values()) buckets[partyLane(g)].push(g);

  const order: Lane[] = ["apex", "field", "rookie"];
  let waiting: Lobby = { lane: laneOf(queue[0]!.mmr), teams: [], full: false };
  for (const lane of order) {
    const parts = buckets[lane];
    const n = parts.reduce((s, g) => s + g.length, 0);
    if (n < SEATS) {
      if (n > waiting.teams.reduce((s, t) => s + t.seats.length, 0)) waiting = { lane, teams: [], full: false };
      continue;
    }
    const teams: Fireteam[] = [];
    let solos: Pilot[] = parts.filter((g) => g.length === 1).flat();
    const stacked = parts.filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
    for (const g of stacked) {
      if (teams.length >= SQUADS) break;
      const { team, rest } = fillTeam(g, solos);
      solos = rest;
      if (team.seats.length === SQUAD && team.lane === lane) teams.push(team);
      else solos.push(...team.seats);
    }
    while (teams.length < SQUADS && solos.length >= SQUAD) {
      const { team, rest } = fillTeam([], solos);
      solos = rest;
      if (team.seats.length === SQUAD) teams.push(team);
      else break;
    }
    if (teams.length === SQUADS) return { lane, teams, full: true };
    waiting = { lane, teams, full: false };
  }
  return waiting;
}

export function drop(lobby: Lobby): boolean {
  return lobby.full && lobby.teams.length === SQUADS;
}

export function note(lobby: Lobby) {
  if (!lobby.full) return `Waiting ${SEATS} in ${lobby.lane}. Six to a squad. Walls hold.`;
  return `Drop ${lobby.lane}. ${SQUADS} squads. No mixed lanes.`;
}
