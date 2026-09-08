import { useEffect, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";

const KEY = "hector-journal-v1";

export function JournalView() {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(window.localStorage.getItem(KEY) ?? "");
  }, []);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 px-4">
      <div className="flex h-[min(32rem,88dvh)] w-full max-w-xl flex-col rounded-lg p-4 glass-window">
        <div className="flex items-center">
          <p className="text-sm font-medium">Journal</p>
          <button
            type="button"
            className="ml-auto h-11 px-3 text-sm text-muted"
            onClick={() => useForgeStore.getState().setSurface("work")}
          >
            Close
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            window.localStorage.setItem(KEY, e.target.value);
          }}
          className="mt-3 min-h-0 flex-1 resize-none rounded-md bg-inset p-3 text-sm outline-none"
          placeholder="Write. It stays on this device."
        />
      </div>
    </div>
  );
}
