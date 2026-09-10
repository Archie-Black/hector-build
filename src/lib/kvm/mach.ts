/**
 * Mach capabilities.
 *
 * Stock: a port is not a name. It is a kernel queue. A task holds *rights*
 * in its own ipc_space — local names, unforgeable. One receive right in the
 * whole system. Many send rights. Send-once is move-only, then a dead name.
 * Rights travel in messages (copy-send / move-send / move-receive).
 *
 * Special ports: host (info), host-priv (load kexts, task_for_pid),
 * task-self (own VM), bootstrap (launchd).
 *
 * Hector upgrade: every right carries a knot. A leaked local name without
 * the knot is MACH_SEND_INVALID_RIGHT. Names stay local; knots bind the
 * capability to the kernel object.
 */

export type MachRight = "receive" | "send" | "send-once" | "port-set" | "dead";
export type Disposition = "copy-send" | "move-send" | "move-send-once" | "move-receive" | "make-send";

export type MachMsg = {
  from: string;
  to: string;
  bits: string;
  at: number;
  rights: { kind: MachRight; port: string; knot: string }[];
};

export type MachPort = {
  name: string;
  right: MachRight;
  holder: string;
  knot: string;
  q: MachMsg[];
};

type Right = {
  name: number;
  kind: MachRight;
  port: string;
  urefs: number;
  knot: string;
  members?: number[];
};

type Space = {
  task: string;
  names: Map<number, Right>;
  next: number;
  special: { host: number; hostPriv: number; taskSelf: number; bootstrap: number };
};

type KernelPort = {
  id: string;
  label: string;
  recv: { task: string; name: number } | null;
  sendUrefs: number;
  so: number;
  q: MachMsg[];
  knot: string;
  noSenders: boolean;
};

type VmEntry = { id: string; task: string; size: number; knot: string };

const spaces = new Map<string, Space>();
const kernel = new Map<string, KernelPort>();
const labels = new Map<string, string>();
const vm = new Map<string, VmEntry>();
let seq = 1;

function knotOf(...parts: string[]) {
  let n = 2166136261;
  const s = parts.join("·");
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return (n >>> 0).toString(16).padStart(8, "0");
}

function spaceOf(task: string): Space {
  let s = spaces.get(task);
  if (!s) {
    s = { task, names: new Map(), next: 1, special: { host: 0, hostPriv: 0, taskSelf: 0, bootstrap: 0 } };
    spaces.set(task, s);
  }
  return s;
}

function putRight(s: Space, kind: MachRight, port: string, knot: string, urefs = 1): Right {
  const name = s.next++;
  const r: Right = { name, kind, port, urefs, knot };
  s.names.set(name, r);
  return r;
}

function lookup(task: string, name: number): Right | undefined {
  return spaceOf(task).names.get(name);
}

function portByLabel(label: string) {
  const id = labels.get(label);
  return id ? kernel.get(id) : undefined;
}

function newPort(label: string, owner: string): { port: KernelPort; recv: Right } {
  const id = `p${seq++}`;
  const knot = knotOf(id, label, owner);
  const s = spaceOf(owner);
  const recv = putRight(s, "receive", id, knot);
  const port: KernelPort = {
    id,
    label,
    recv: { task: owner, name: recv.name },
    sendUrefs: 0,
    so: 0,
    q: [],
    knot,
    noSenders: false,
  };
  kernel.set(id, port);
  labels.set(label, id);
  return { port, recv };
}

function hasSend(task: string, port: KernelPort, knot?: string) {
  if (knot && knot !== port.knot) return false;
  for (const r of spaceOf(task).names.values()) {
    if (r.port !== port.id) continue;
    if (r.kind === "send" || r.kind === "send-once" || r.kind === "receive") {
      if (!knot || r.knot === knot) return r;
    }
  }
  return undefined;
}

function consumeSendOnce(task: string, r: Right, port: KernelPort) {
  if (r.kind !== "send-once") return;
  r.kind = "dead";
  r.urefs = 0;
  port.so = Math.max(0, port.so - 1);
  if (port.sendUrefs === 0 && port.so === 0) port.noSenders = true;
}

export function machTask(task: string) {
  return spaceOf(task);
}

export function machAlloc(name: string, holder: string): MachPort {
  const { port } = newPort(name, holder);
  return { name, right: "receive", holder, knot: port.knot, q: port.q };
}

export function machInsertSend(name: string, holder: string): MachPort | { error: string } {
  const port = portByLabel(name);
  if (!port || port.recv?.task !== holder) return { error: "KERN_INVALID_RIGHT" };
  const s = spaceOf(holder);
  const existing = [...s.names.values()].find((r) => r.port === port.id && r.kind === "send");
  if (existing) {
    existing.urefs += 1;
    port.sendUrefs += 1;
    return { name, right: "send", holder, knot: port.knot, q: port.q };
  }
  putRight(s, "send", port.id, port.knot);
  port.sendUrefs += 1;
  return { name, right: "send", holder, knot: port.knot, q: port.q };
}

export function machMakeSendOnce(label: string, holder: string): MachPort | { error: string } {
  const port = portByLabel(label);
  if (!port || port.recv?.task !== holder) return { error: "KERN_INVALID_RIGHT" };
  putRight(spaceOf(holder), "send-once", port.id, port.knot);
  port.so += 1;
  return { name: label, right: "send-once", holder, knot: port.knot, q: port.q };
}

export function machSendName(task: string, localName: number, bits: string): MachMsg | { error: string } {
  const r = lookup(task, localName);
  if (!r || r.kind === "dead" || r.kind === "port-set") return { error: "MACH_SEND_INVALID_DEST" };
  const port = kernel.get(r.port);
  if (!port || !port.recv) return { error: "MACH_SEND_INVALID_DEST" };
  if (r.kind !== "send" && r.kind !== "send-once" && r.kind !== "receive") return { error: "MACH_SEND_INVALID_RIGHT" };
  const msg: MachMsg = { from: task, to: port.label, bits: bits.slice(0, 4000), at: Date.now(), rights: [] };
  port.q.push(msg);
  if (port.q.length > 32) port.q.shift();
  consumeSendOnce(task, r, port);
  return msg;
}

export function machSend(name: string, from: string, bits: string, knot?: string): MachMsg | { error: string } {
  const port = portByLabel(name);
  if (!port) return { error: "MACH_SEND_INVALID_DEST" };
  if (!port.recv) return { error: "MACH_SEND_INVALID_DEST" };
  const right = hasSend(from, port, knot);
  if (!right) return { error: knot ? "MACH_SEND_INVALID_RIGHT" : "MACH_SEND_INVALID_DEST" };
  const msg: MachMsg = { from, to: name, bits: bits.slice(0, 4000), at: Date.now(), rights: [] };
  port.q.push(msg);
  if (port.q.length > 32) port.q.shift();
  consumeSendOnce(from, right, port);
  return msg;
}

export function machRecv(name: string, holder: string): MachMsg | { error: string } {
  const port = portByLabel(name);
  if (!port) return { error: "MACH_RCV_INVALID_NAME" };
  if (port.recv?.task !== holder) return { error: "MACH_RCV_INVALID_NAME" };
  const msg = port.q.shift();
  if (!msg) return { error: "MACH_RCV_TIMED_OUT" };
  for (const passed of msg.rights) settleRight(holder, passed);
  return msg;
}

function settleRight(task: string, passed: MachMsg["rights"][number]) {
  const port = kernel.get(passed.port);
  if (!port) return;
  if (passed.kind === "receive") {
    port.recv = { task, name: spaceOf(task).next };
    putRight(spaceOf(task), "receive", port.id, port.knot);
  } else if (passed.kind === "send-once") {
    putRight(spaceOf(task), "send-once", port.id, port.knot);
  } else if (passed.kind === "send") {
    putRight(spaceOf(task), "send", port.id, port.knot);
    port.sendUrefs += 1;
  }
}

export function machPass(
  from: string,
  destLabel: string,
  carryLabel: string,
  disposition: Disposition,
  bits = "",
): MachMsg | { error: string } {
  const dest = portByLabel(destLabel);
  const carry = portByLabel(carryLabel);
  if (!dest || !carry) return { error: "MACH_SEND_INVALID_DEST" };
  const sendRight = hasSend(from, dest);
  if (!sendRight) return { error: "MACH_SEND_INVALID_DEST" };
  const s = spaceOf(from);
  const held = [...s.names.values()].find((r) => r.port === carry.id);
  if (!held) return { error: "KERN_INVALID_RIGHT" };
  if (disposition === "move-receive" && held.kind !== "receive") return { error: "KERN_INVALID_RIGHT" };
  if (disposition === "move-send-once" && held.kind !== "send-once") return { error: "KERN_INVALID_RIGHT" };
  if ((disposition === "copy-send" || disposition === "move-send" || disposition === "make-send") && held.kind !== "send" && held.kind !== "receive") {
    return { error: "KERN_INVALID_RIGHT" };
  }
  const kind: MachRight =
    disposition === "move-receive" ? "receive" : disposition === "move-send-once" ? "send-once" : "send";
  if (disposition.startsWith("move")) {
    if (held.kind === "receive") carry.recv = null;
    if (held.kind === "send") carry.sendUrefs = Math.max(0, carry.sendUrefs - held.urefs);
    s.names.delete(held.name);
  }
  const msg: MachMsg = {
    from,
    to: destLabel,
    bits,
    at: Date.now(),
    rights: [{ kind, port: carry.id, knot: carry.knot }],
  };
  dest.q.push(msg);
  return msg;
}

export function machPortSet(task: string, members: string[]) {
  const s = spaceOf(task);
  const knot = knotOf("set", task, String(s.next));
  const r = putRight(s, "port-set", `set:${task}:${s.next - 1}`, knot);
  r.members = members
    .map((label) => {
      const p = portByLabel(label);
      return p?.recv?.task === task ? p.recv.name : 0;
    })
    .filter(Boolean);
  return { name: r.name, knot: r.knot, members: r.members };
}

export function machRecvSet(task: string, setName: number): MachMsg | { error: string } {
  const set = lookup(task, setName);
  if (!set || set.kind !== "port-set") return { error: "MACH_RCV_INVALID_NAME" };
  for (const n of set.members ?? []) {
    const r = lookup(task, n);
    if (!r) continue;
    const port = kernel.get(r.port);
    if (port?.q.length) {
      const msg = port.q.shift();
      if (msg) return msg;
    }
  }
  return { error: "MACH_RCV_TIMED_OUT" };
}

export function taskForPid(caller: string, pid: string): MachPort | { error: string } {
  const priv = spaceOf(caller).special.hostPriv;
  const right = lookup(caller, priv);
  const port = right ? kernel.get(right.port) : undefined;
  if (!right || !port || right.kind === "dead") return { error: "KERN_FAILURE" };
  if (port.label !== "com.hector.host-priv") return { error: "KERN_FAILURE" };
  const target = portByLabel(`task.${pid}`);
  if (!target) return { error: "KERN_INVALID_TASK" };
  putRight(spaceOf(caller), "send", target.id, target.knot);
  target.sendUrefs += 1;
  return { name: `task.${pid}`, right: "send", holder: caller, knot: target.knot, q: target.q };
}

export function machVmAllocate(task: string, size: number) {
  const self = lookup(task, spaceOf(task).special.taskSelf);
  if (!self) return { error: "KERN_INVALID_TASK" as const };
  const id = `vm${seq++}`;
  const entry: VmEntry = { id, task, size: Math.max(4096, size), knot: knotOf(id, task) };
  vm.set(id, entry);
  return entry;
}

export function machNoSenders(label: string) {
  return portByLabel(label)?.noSenders === true;
}

export function machStatus() {
  return [...kernel.values()].map((p) => ({
    name: p.label,
    right: p.recv ? ("receive" as const) : ("dead" as const),
    holder: p.recv?.task ?? "",
    knot: p.knot,
    depth: p.q.length,
    sendUrefs: p.sendUrefs,
    so: p.so,
    noSenders: p.noSenders,
  }));
}

export function machSpaces() {
  return [...spaces.values()].map((s) => ({
    task: s.task,
    rights: [...s.names.values()].map((r) => ({ name: r.name, kind: r.kind, urefs: r.urefs })),
    special: s.special,
  }));
}

export function machBoot() {
  spaces.clear();
  kernel.clear();
  labels.clear();
  vm.clear();
  seq = 1;
  for (const task of ["hector", "kvm", "launchd", "hx"]) {
    const { recv } = newPort(`task.${task}`, task);
    spaceOf(task).special.taskSelf = recv.name;
  }
  const host = newPort("com.hector.host", "hector");
  const priv = newPort("com.hector.host-priv", "hector");
  spaceOf("hector").special.host = host.recv.name;
  spaceOf("hector").special.hostPriv = priv.recv.name;
  machInsertSend("com.hector.host", "hector");
  machInsertSend("com.hector.host-priv", "hector");
  const hid = newPort("com.hector.darwin.hid", "kvm");
  machInsertSend("com.hector.darwin.hid", "kvm");
  const web = newPort("com.hector.darwin.webconnect", "launchd");
  spaceOf("launchd").special.bootstrap = web.recv.name;
  newPort("com.spectralhx.seat", "hx");
  void hid;
  return machStatus();
}
