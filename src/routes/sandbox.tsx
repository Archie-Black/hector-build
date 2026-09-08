import { createFileRoute } from "@tanstack/react-router";
import { SandboxStage } from "@/components/forge/sandbox-stage";

export const Route = createFileRoute("/sandbox")({ component: SandboxStage });
