import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { confirmToken } from "@/lib/auth/local-account";

export const Route = createFileRoute("/verify")({ component: VerifyPage });

function VerifyPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verifying…");
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t") || "";
    void confirmToken(t)
      .then(() => {
        setMsg("Email verified. You can log in.");
        void navigate({ to: "/" });
      })
      .catch((err: Error) => setMsg(err.message));
  }, [navigate]);
  return (
    <div className="flex h-dvh items-center justify-center px-6">
      <p className="rounded-lg px-6 py-8 text-sm glass-window">{msg}</p>
    </div>
  );
}
