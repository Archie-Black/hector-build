import { createFileRoute } from "@tanstack/react-router";
import { HxApp } from "@/components/hx/hx-app";

export const Route = createFileRoute("/hx")({ component: HxApp });
