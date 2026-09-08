import { createFileRoute } from "@tanstack/react-router";
import { HxIsolatedSession } from "@/components/hx/hx-session-frame";

export const Route = createFileRoute("/hx/session")({ component: HxIsolatedSession });
