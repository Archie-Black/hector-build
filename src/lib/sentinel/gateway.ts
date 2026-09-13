/** Local event gateway. Encrypted-at-rest is the vault. No cloud. */

export type Sense = "mic" | "desk" | "cal" | "mail" | "text";

export type Event = {
  sense: Sense;
  body: string;
  at: number;
};

const Q: Event[] = [];

export function ingest(e: Event) {
  Q.push(e);
  if (Q.length > 50) Q.shift();
  return { ok: true, n: Q.length };
}

export function recent() {
  return Q.slice();
}

export function resetGateway() {
  Q.length = 0;
}
