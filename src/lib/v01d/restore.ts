/** Pick a database dump. Newest if none named. */

const DUMP = /^v01d-\d{8}T\d{6}Z\.sql$/;

export function pickDump(names: string[], want?: string) {
  const sql = names.filter((n) => DUMP.test(n.split("/").pop() || n)).sort().reverse();
  if (want) {
    const base = want.split("/").pop() || want;
    if (DUMP.test(base) && sql.includes(base)) return base;
    if (sql.includes(want)) return want;
    return null;
  }
  return sql[0] || null;
}
