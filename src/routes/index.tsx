import { createFileRoute } from "@tanstack/react-router";
import { HorsemenDesk } from "@/components/horsemen/desk";

export const Route = createFileRoute("/")({
  component: HorsemenDesk,
});
