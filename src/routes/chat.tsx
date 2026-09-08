import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "@/components/forge/back-button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({ component: MatrixChat });

function MatrixChat() {
  const navigate = useNavigate();
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <div className="flex items-center gap-2 px-2 pt-1">
        <BackButton onClick={() => void navigate({ to: "/" })} />
        <p className="text-sm">Doomchat · Matrix</p>
      </div>
      <iframe title="Element" src="/element/index.html" className="min-h-0 flex-1 border-0" />
    </div>
  );
}
