import { useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { explainTrace, pickMode } from "@/lib/workspace/intent";
import { probeOwnerKey, runForgeTurn } from "@/lib/workspace/run-turn";
import { hashFiles, knotSeals } from "@/lib/workspace/hash";
import { isHelloJob, localApply } from "@/lib/workspace/local-job";
import { yieldToDevice } from "@/lib/hx/session";
import { recordHxJob } from "@/lib/superset/record";
import { writeEpisode } from "@/lib/memory/warehouse";
import { workingPack } from "@/lib/geometry/ontology";
import { packFiles, statsOf } from "@/lib/geopack/volume";
import { saveVolume } from "@/lib/geopack/persist";
import { critique, learnFromTurn, valueLessons } from "@/lib/align/cai";
import { mentionedPaths, workspaceRules, attachFiles } from "@/lib/workspace/context";
import { diagnostics } from "@/lib/ide/symbols";
import { gitNativeStatus } from "@/lib/ide/native-git";
import { loadExt } from "@/lib/workspace/extensions-store";
import { loadHome } from "@/lib/ollama/home";
import { spoolFor } from "@/lib/spool/client";

export function useAgentSend(voice: "hector" | "hx" = "hx") {
  const software = useForgeStore((s) => s.software);
  const repo = useForgeStore((s) => s.repo);
  const [error, setError] = useState<string | null>(null);

  async function seal(paths: string[]) {
    const files = useForgeStore.getState().files;
    const hashes = await hashFiles(files, paths);
    if (files["demo/HASHES.md"] !== undefined || paths.includes("demo/HASHES.md")) {
      const body = Object.entries(hashes)
        .map(([p, h]) => `- \`${p}\` \`${h}\``)
        .join("\n");
      useForgeStore.getState().applyAgentFiles({
        "demo/HASHES.md": `# hashes\n\n${body}\n`,
        "demo/KNOTS.md": knotSeals(files, paths),
      });
    }
    useForgeStore.getState().sealHashes(hashes);
  }

  async function send(raw?: string) {
    const store = useForgeStore.getState();
    const incoming = (raw ?? store.draft).trim();
    if (!incoming || store.busy) return;
    void spoolFor(incoming);
    await yieldToDevice();
    const applyNow = incoming.startsWith("Execute the approved plan");
    const prompt = incoming.replace(/^\/(plan|scout|patch|swarm|hx)\s+/i, "");
    const mode = applyNow ? "swarm" : incoming.startsWith("/") ? pickMode(incoming) : "swarm";

    if (!store.granted) store.grant();

    if (!store.addSpend(3)) {
      setError("Spend cap reached.");
      return;
    }

    if (isHelloJob(prompt)) {
      store.setDraft("");
      store.pushMessage({ id: crypto.randomUUID(), role: "user", content: prompt, mode: "swarm", speaker: "you" });
      if (voice === "hector") {
        store.openHx();
        store.pushMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Briefing Spectral HX. Assignment: add hello() to demo/main.py.",
          mode: "swarm",
          speaker: "hector",
        });
      }
      store.takeCheckpoint();
      store.setBusy(true);
      store.planTasks(prompt, "swarm");
      const result = localApply(store.files);
      store.applyAgentFiles(result.files);
      store.setDiffs(result.diffs);
      store.pushMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          voice === "hector"
            ? "Spectral HX finished. hello() is in demo/main.py."
            : "Done. hello() is in demo/main.py.",
        mode: "swarm",
        speaker: voice,
      });
      await seal(result.diffs.map((d) => d.path).concat("demo/HASHES.md"));
      store.markChip(true);
      store.setBusy(false);
      store.setStatus("Job complete.");
      void recordHxJob({
        data: {
          id: crypto.randomUUID(),
          voice,
          prompt,
          ok: true,
          spend: 1,
          lanes: useForgeStore.getState().tasks.map((t) => ({
            id: t.id,
            role: t.assignee,
            title: t.title,
            crew: t.crew,
            status: t.status,
          })),
          traces: [],
        },
      });
      return;
    }

    if (/(install|npm i |pip install|apt install)/i.test(prompt)) {
      store.pushTerm("STUB install — preview host will not run package managers.");
    }
    setError(null);
    store.setDraft("");
    store.pushMessage({ id: crypto.randomUUID(), role: "user", content: prompt, mode, speaker: "you" });
    if (voice === "hector") {
      store.openHx();
      store.pushMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Briefing Spectral HX parallel bots. Assignment: ${prompt.slice(0, 140)}.`,
        mode,
        speaker: "hector",
      });
    }
    store.planTasks(prompt, mode);
    if (mode === "swarm" || mode === "patch") store.takeCheckpoint();
    store.setPhase("apply");
    store.setBusy(true);
    try {
      const history = useForgeStore
        .getState()
        .messages.filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const pack = workingPack(store.files, prompt);
      const mentions = mentionedPaths(prompt, store.files);
      if (store.activePath && !mentions.includes(store.activePath)) mentions.unshift(store.activePath);
      const lints = diagnostics(store.files).slice(0, 12);
      const rules = workspaceRules(store.files);
      let gitLine = "";
      try {
        const git = await gitNativeStatus();
        gitLine = git.live ? `Git: ${git.text.slice(0, 400)}` : "";
      } catch {
        gitLine = "";
      }
      const extra = [
        voice === "hector" ? "Host: Hector Build. Coding floor: Spectral HX. Parallel bots." : "Parallel Spectral HX lanes.",
        repo ? `Granted repo: ${repo}` : "Granted local workspace.",
        software.length ? `Approved software: ${software.join(", ")}` : "",
        `Open: ${store.activePath}:${store.cursorLine}`,
        pack.paths.length ? `Observed set: ${pack.paths.join(", ")}` : "",
        pack.geo ? pack.geo : "",
        pack.text ? `Lattice chunks:\n${pack.text}` : "",
        gitLine,
        lints.length ? `Lints:\n${lints.map((l) => `${l.path}:${l.line} ${l.message}`).join("\n")}` : "",
        rules ? `Workspace rules:\n${rules}` : "",
        mentions.length ? attachFiles(store.files, mentions) : "",
      ]
        .filter(Boolean)
        .join("\n");
      const snap = { ...store.files };
      const ext = loadExt();
      const shared = {
        voice,
        files: snap,
        history,
        lessons: [...store.memory.lessons, ...valueLessons()],
        visitorKey: store.providerId === "hector" || store.providerId === "ollama" || store.providerId === "lmstudio"
          ? undefined
          : store.visitorKey || undefined,
        providerId: store.providerId,
        homeUrl: loadHome().url || undefined,
        baseUrl: store.baseUrl,
        model: store.model,
        arcadeKey: ext.arcadeKey || undefined,
        arcadeUser: ext.arcadeUser || undefined,
        gcpToken: ext.gcpToken || undefined,
        gcpProject: ext.gcpProject || undefined,
        gcpMcp: ext.gcpMcp || undefined,
        ibmForge: ext.ibmForge || undefined,
        ibmForgeToken: ext.ibmForgeToken || undefined,
      };
      const lanes =
        mode === "scout"
          ? [{ mode: "scout" as const, prompt: `SCOUT ONLY.\n${prompt}\n${extra}` }]
          : [
              { mode: "scout" as const, prompt: `SCOUT ONLY. No writes.\n${prompt}\n${extra}` },
              { mode: "swarm" as const, prompt: `PATCH LANE. Implement fully.\n${prompt}\n${extra}` },
              { mode: "swarm" as const, prompt: `CHECKS LANE. Add and run tests.\n${prompt}\n${extra}` },
            ];
      const results = await Promise.all(lanes.map((lane) => runForgeTurn({ data: { ...shared, mode: lane.mode, prompt: lane.prompt } })));
      const last = results[results.length - 1];
      if (mode !== "scout" && last?.ok) {
        const fail = (last.tests ?? []).filter((t) => !t.pass).length;
        if (fail) {
          const closer = await runForgeTurn({
            data: {
              ...shared,
              files: last.files,
              mode: "swarm",
              prompt: `CLOSE. prove then fix. Do not stop. Failures remain. Original job:\n${prompt.slice(0, 2000)}`,
            },
          });
          results.push(closer);
        }
      }
      for (const result of results) {
        if (result.needKey) useForgeStore.getState().setNeedKey(true);
        if (!result.ok && result.error) setError(result.error);
        useForgeStore.getState().applyAgentFiles(result.files);
      }
      const traces = results.flatMap((r) => r.traces);
      const todos = results.flatMap((r) => r.todos ?? []);
      const diffs = results.flatMap((r) => r.diffs ?? []);
      const reply = results
        .map((r) => r.reply)
        .filter(Boolean)
        .join("\n\n");
      if (reply) {
        useForgeStore.getState().pushMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          mode,
          speaker: voice,
        });
      }
      useForgeStore.getState().setTraces(traces);
      useForgeStore.getState().setTodos(todos);
      useForgeStore.getState().setDiffs(diffs);
      const plan = results.map((r) => r.plan).find(Boolean);
      if (plan) useForgeStore.getState().setPlan(plan);
      useForgeStore.getState().reviewMemory(traces);
      for (const t of traces) {
        useForgeStore.getState().pushVerbose(explainTrace(t.name, t.detail, t.ok));
      }
      if (diffs.length) await seal(diffs.map((d) => d.path));
      void packFiles(useForgeStore.getState().files).then(async (vol) => {
        await saveVolume(vol);
        useForgeStore.setState({ packStats: statsOf(vol) });
      });
      const tests = useForgeStore.getState().tests;
      if (tests.length && tests.every((t) => t.pass)) useForgeStore.getState().markChip(true);
      useForgeStore.getState().setPhase("review");
      const nextFail = tests.filter((t) => t.pass === false).length;
      const cai = critique({
        reply,
        fail: nextFail,
        traces,
        diffs: useForgeStore.getState().diffs,
      });
      learnFromTurn({ user: prompt, reply, fail: nextFail, critique: cai });
      if (!cai.ok) useForgeStore.getState().remember(cai.violations[0] ?? "Stay inside the constitution.");
      useForgeStore.getState().setStatus(nextFail ? `${nextFail} check(s) still failing.` : "Parallel bots complete.");
      void recordHxJob({
        data: {
          id: crypto.randomUUID(),
          voice,
          prompt,
          ok: results.every((r) => r.ok),
          spend: lanes.length,
          lanes: useForgeStore.getState().tasks.map((t) => ({
            id: t.id,
            role: t.assignee,
            title: t.title,
            crew: t.crew,
            status: t.status,
          })),
          traces: traces.map((t) => ({ name: t.name, ok: t.ok, detail: t.detail })),
        },
      });
      void writeEpisode({
        data: {
          id: crypto.randomUUID(),
          voice,
          prompt,
          outcome: reply.slice(0, 400) || (results.every((r) => r.ok) ? "ok" : "fail"),
          ok: results.every((r) => r.ok),
          spend: lanes.length,
          traces: traces.map((t) => t.name).join(","),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      useForgeStore.getState().setBusy(false);
    }
  }

  return { send, error, probe: probeOwnerKey };
}
