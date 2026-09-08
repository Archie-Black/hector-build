import { useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { downloadProject } from "@/lib/workspace/library";

const FACES = ["library", "sandbox", "software"] as const;

export function ProjectRolodex() {
  const [face, setFace] = useState(0);
  const library = useForgeStore((s) => s.library);
  const files = useForgeStore((s) => s.files);

  return (
    <div className="px-3 pb-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs tracking-[0.14em] text-subtle uppercase">Rolodex</p>
        <button
          type="button"
          className="h-11 px-2 text-xs text-muted hover:text-fg"
          onClick={() => setFace((n) => (n + 1) % FACES.length)}
        >
          Flip
        </button>
      </div>
      <div className="rolodex">
        {FACES.map((id, i) => {
          const offset = (i - face + FACES.length) % FACES.length;
          return (
            <article
              key={id}
              className="rolodex-card"
              style={{
                transform: `translateY(${offset * 8}px) rotateX(${offset * -8}deg)`,
                opacity: offset > 2 ? 0 : 1 - offset * 0.18,
                zIndex: 10 - offset,
              }}
            >
              {id === "library" ? (
                <>
                  <p className="text-sm font-medium">Library of projects</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {library.map((p) => (
                      <li key={p.id}>
                        {p.name}
                        <span className="text-subtle"> · {p.detail}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {id === "sandbox" ? (
                <>
                  <p className="text-sm font-medium">Sandboxing</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                    Isolate writes. Leave the sandbox to restore the last safe snapshot.
                  </p>
                  <button
                    type="button"
                    className="mt-3 h-11 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
                    onClick={() => void useForgeStore.getState().openSandbox()}
                  >
                    Pop out sandbox
                  </button>
                </>
              ) : null}
              {id === "software" ? (
                <>
                  <p className="text-sm font-medium">Open software</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                    Download a project bundle to run locally.
                  </p>
                  <button
                    type="button"
                    className="mt-3 h-11 rounded-md bg-raised px-3 text-sm"
                    onClick={() => downloadProject(files, library[0]?.name ?? "hector-project")}
                  >
                    Open current build
                  </button>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
