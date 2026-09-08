export type LibraryProject = {
  id: string;
  name: string;
  detail: string;
  kind: "workspace" | "repo" | "software";
};

export const SEED_LIBRARY: LibraryProject[] = [
  {
    id: "scar-ledger",
    name: "Scar Ledger",
    detail: "Local workspace package",
    kind: "workspace",
  },
];

export function downloadProject(files: Record<string, string>, name: string) {
  const blob = new Blob([JSON.stringify({ name, files }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.hector.json`;
  a.click();
  URL.revokeObjectURL(url);
}
