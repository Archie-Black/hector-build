import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/forge/admin-panel";

export const Route = createFileRoute("/admin")({ component: AdminPanel });
