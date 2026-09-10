/** launchd for Hector Darwin. Jobs are agents. KeepAlive is the default. */

export type LaunchJob = {
  label: string;
  program: string;
  args: string[];
  keepAlive: boolean;
  sockets?: Record<string, number>;
  agent: string;
  state: "loaded" | "running" | "exited";
};

const jobs = new Map<string, LaunchJob>();

const BOOTSTRAP: Omit<LaunchJob, "state">[] = [
  {
    label: "com.hector.webconnect",
    program: "hector-webconnect",
    args: ["--bind", "127.0.0.1", "--port", "6081"],
    keepAlive: true,
    sockets: { Listeners: 6081 },
    agent: "hector",
  },
  {
    label: "com.hector.kvm",
    program: "hector-kvm",
    args: ["--hid", "iokit"],
    keepAlive: true,
    agent: "hector",
  },
  {
    label: "com.spectralhx.seat",
    program: "spectral-hx",
    args: ["--seat", "hx"],
    keepAlive: true,
    agent: "hx",
  },
];

export function launchctlLoad() {
  for (const j of BOOTSTRAP) {
    jobs.set(j.label, { ...j, state: "running" });
  }
  return listJobs();
}

export function listJobs() {
  return [...jobs.values()];
}

export function launchctlKick(label: string) {
  const j = jobs.get(label);
  if (!j) return { error: "Unknown job" as const };
  j.state = "running";
  return j;
}

export function webconnectPort() {
  return jobs.get("com.hector.webconnect")?.sockets?.Listeners ?? 6081;
}
