/**
 * Windows print spooler / CUPS, as the agent job queue.
 * Write the job to disk first. Drain when the device is up. Never wait on cold start.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDevice, plug } from "./bus.ts";

export type JobState = "spooling" | "held" | "processing" | "completed" | "error";

export type PrintJob = {
  id: string;
  device: string;
  title: string;
  body: string;
  state: JobState;
  at: number;
  tries: number;
};

const DIR = join(process.cwd(), "data", "devices", "spool");

function boot() {
  mkdirSync(DIR, { recursive: true });
}

function pathOf(id: string) {
  return join(DIR, `${id}.job.json`);
}

export function enqueueJob(input: { device: string; title: string; body?: string }) {
  boot();
  const ready = getDevice(input.device);
  const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const job: PrintJob = {
    id,
    device: input.device,
    title: input.title.slice(0, 200),
    body: (input.body ?? "").slice(0, 8000),
    state: ready && (ready.state === "started" || ready.state === "present") ? "processing" : "held",
    at: Date.now(),
    tries: 0,
  };
  writeFileSync(pathOf(id), JSON.stringify(job));
  return job;
}

export function listJobs() {
  boot();
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".job.json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(DIR, f), "utf8")) as PrintJob;
      } catch {
        return null;
      }
    })
    .filter((j): j is PrintJob => Boolean(j))
    .sort((a, b) => a.at - b.at);
}

function saveJob(job: PrintJob) {
  writeFileSync(pathOf(job.id), JSON.stringify(job));
}

/** Port monitor: if the device came back, release held jobs. */
export function drainJobs(device?: string) {
  const out: PrintJob[] = [];
  for (const job of listJobs()) {
    if (device && job.device !== device) continue;
    const dev = getDevice(job.device);
    const up = dev && (dev.state === "started" || dev.state === "present");
    if (job.state === "held" && up) {
      job.state = "processing";
      job.tries += 1;
      saveJob(job);
      out.push(job);
    } else if (job.state === "processing" && up) {
      job.state = "completed";
      saveJob(job);
      out.push(job);
    } else if (job.state === "completed" && Date.now() - job.at > 86_400_000 && existsSync(pathOf(job.id))) {
      unlinkSync(pathOf(job.id));
    }
  }
  return out;
}

export function holdDevice(id: string) {
  plug(id, false);
  for (const job of listJobs()) {
    if (job.device === id && job.state === "processing") {
      job.state = "held";
      saveJob(job);
    }
  }
}

export function startDevice(id: string) {
  plug(id, true);
  return drainJobs(id);
}

export function spoolStatus() {
  const jobs = listJobs();
  return {
    object: "hector.print",
    held: jobs.filter((j) => j.state === "held").length,
    processing: jobs.filter((j) => j.state === "processing").length,
    jobs: jobs.slice(-20),
  };
}
