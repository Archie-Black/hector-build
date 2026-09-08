import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useForgeStore } from "@/lib/forge-store";

const TEXT = /\.(md|txt|js|ts|tsx|jsx|json|css|html|yml|yaml|toml|mjs|cjs|bat|cmd|sh|py|rs|go|java|kt|swift|xml|svg|csv)$/i;

export function AddFilesButton() {
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onPick(list: FileList | null) {
    if (!list?.length) return;
    const incoming: Record<string, string> = {};
    let skipped = 0;
    for (const file of Array.from(list)) {
      if (file.size > 200_000 || (!TEXT.test(file.name) && !file.type.startsWith("text/"))) {
        skipped += 1;
        continue;
      }
      const path = file.webkitRelativePath || file.name;
      incoming[path] = await file.text();
    }
    const n = Object.keys(incoming).length;
    if (n) {
      useForgeStore.getState().addFiles(incoming);
      useForgeStore.getState().pushVerbose(`Batch add: ${n} file(s) imported.`);
    }
    setNote(skipped ? `${n} added, ${skipped} skipped (binary or too large).` : `${n} file(s) added.`);
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="flex h-11 items-center gap-1 rounded-md px-3 text-xs text-muted hover:text-fg"
        onClick={() => input.current?.click()}
      >
        <Plus className="size-3.5" />
        Add files
      </button>
      {note ? <p className="px-3 text-[11px] text-subtle">{note}</p> : null}
    </div>
  );
}
