/**
 * Mach, upgraded.
 * Stock XNU: a port is a capability. Send, receive, send-once, dead-name.
 * Hector: each right also carries a knot id so a stolen name is not a stolen right.
 */
export type MachRight = "receive" | "send" | "send-once" | "dead";

export type MachMsg = {
  from: string;
  to: string;
  bits: string;
  at: number;
};

export type MachPort = {
  name: string;
  right: MachRight;
  holder: string;
  knot: string;
  q: MachMsg[];
};

const ports = new Map<string, MachPort>();

function knotOf(name: string, holder: string) {
  let n = 2166136261;
  const s = `${name}·${holder}·hector-darwin`;
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return (n >>> 0).toString(16).padStart(8, "0");
}

export function machAlloc(name: string, holder: string): MachPort {
  const port: MachPort = { name, right: "receive", holder, knot: knotOf(name, holder), q: [] };
  ports.set(name, port);
  return port;
}

export function machSend(name: string, from: string, bits: string, knot?: string): MachMsg | { error: string } {
  const p = ports.get(name);
  if (!p) return { error: "MACH_SEND_INVALID_DEST" };
  if (p.right === "dead") return { error: "MACH_SEND_INVALID_DEST" };
  if (knot && knot !== p.knot) return { error: "MACH_SEND_INVALID_RIGHT" };
  const msg: MachMsg = { from, to: name, bits: bits.slice(0, 4000), at: Date.now() };
  p.q.push(msg);
  if (p.q.length > 32) p.q.shift();
  if (p.right === "send-once") p.right = "dead";
  return msg;
}

export function machRecv(name: string, holder: string): MachMsg | { error: string } {
  const p = ports.get(name);
  if (!p) return { error: "MACH_RCV_INVALID_NAME" };
  if (p.holder !== holder) return { error: "MACH_RCV_INVALID_NAME" };
  const msg = p.q.shift();
  if (!msg) return { error: "MACH_RCV_TIMED_OUT" };
  return msg;
}

export function machInsertSend(name: string, holder: string): MachPort | { error: string } {
  const p = ports.get(name);
  if (!p || p.holder !== holder) return { error: "KERN_INVALID_RIGHT" };
  return { ...p, right: "send" };
}

export function machStatus() {
  return [...ports.values()].map(({ name, right, holder, knot, q }) => ({
    name,
    right,
    holder,
    knot,
    depth: q.length,
  }));
}

export function machBoot() {
  machAlloc("com.hector.host-priv", "hector");
  machAlloc("com.hector.darwin.hid", "kvm");
  machAlloc("com.hector.darwin.webconnect", "launchd");
  machAlloc("com.spectralhx.seat", "hx");
  machInsertSend("com.hector.darwin.hid", "kvm");
  return machStatus();
}
