export function diffsFrom(before: Record<string, string>, after: Record<string, string>) {
  const paths = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...paths]
    .filter((p) => before[p] !== after[p])
    .map((path) => ({ path, before: before[path] ?? "", after: after[path] ?? "" }));
}
