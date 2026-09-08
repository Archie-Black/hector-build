import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bi")({
  beforeLoad: () => {
    throw redirect({ to: "/hx" });
  },
  component: () => null,
});
