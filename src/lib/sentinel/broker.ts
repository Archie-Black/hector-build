/** Local swarm bus. In-process. Optional WebSocket later. Nothing public. */

export type Msg = { topic: string; from: string; body: string; at: number };

type Fn = (m: Msg) => void;
const subs = new Map<string, Set<Fn>>();
const log: Msg[] = [];

export function pub(topic: string, from: string, body: string) {
  const m: Msg = { topic, from, body, at: Date.now() };
  log.push(m);
  if (log.length > 200) log.shift();
  for (const fn of subs.get(topic) || []) fn(m);
  for (const fn of subs.get("*") || []) fn(m);
  return m;
}

export function sub(topic: string, fn: Fn) {
  if (!subs.has(topic)) subs.set(topic, new Set());
  subs.get(topic)!.add(fn);
  return () => subs.get(topic)?.delete(fn);
}

export function tape() {
  return log.slice();
}

export function resetBus() {
  subs.clear();
  log.length = 0;
}
