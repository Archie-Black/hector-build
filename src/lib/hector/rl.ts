/** Hector RL. Q-learn which metal runs which job. Never gives up. */

export type Action = "rdna" | "cuda" | "vulkan";

const ALPHA = 0.25;
const GAMMA = 0.35;
const EPS = 0.12;
const ACT: Action[] = ["rdna", "cuda", "vulkan"];
const Q = new Map<string, Record<Action, number>>();
const N = new Map<string, Record<Action, number>>();

function slot(job: string) {
  if (!Q.has(job)) {
    Q.set(job, { rdna: 0, cuda: 0, vulkan: 0 });
    N.set(job, { rdna: 0, cuda: 0, vulkan: 0 });
  }
  return { q: Q.get(job)!, n: N.get(job)! };
}

export function reward(ms: number, ok: boolean) {
  const r = 100 / (1 + Math.max(0, ms));
  return ok ? r : r - 12;
}

export function act(job: string, explore = true): Action {
  const { q, n } = slot(job);
  if (explore) {
    const unseen = ACT.find((a) => n[a] === 0);
    if (unseen) return unseen;
    if (Math.random() < EPS) return ACT[Math.floor(Math.random() * ACT.length)]!;
  }
  return ACT.reduce((b, a) => (q[a] > q[b] ? a : b));
}

export function learn(job: string, a: Action, r: number, next = job) {
  const { q, n } = slot(job);
  n[a] += 1;
  const nxt = slot(next).q;
  const maxN = Math.max(nxt.rdna, nxt.cuda, nxt.vulkan);
  q[a] += ALPHA * (r + GAMMA * maxN - q[a]);
  return q[a];
}

export function qrow(job: string) {
  const { q, n } = slot(job);
  return { q: { ...q }, n: { ...n } };
}

export function resetRl() {
  Q.clear();
  N.clear();
}

export function sayRl() {
  const jobs = ["step", "lidar", "vision", "imu"];
  return jobs
    .map((j) => {
      const { q, n } = slot(j);
      const best = ACT.reduce((b, a) => (q[a] > q[b] ? a : b));
      const visits = n.rdna + n.cuda + n.vulkan;
      return visits ? `${j}:${best}` : `${j}:learn`;
    })
    .join(" ");
}
