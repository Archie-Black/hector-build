/** Adapter that runs on a box that never installed OS V01D. */

import type { Face } from "./sniff";

export function kit(path: string, from: Face, to: Face, move: "rebuild" | "adapt") {
  const name = path.split(/[\\/]/).pop() || "program";
  const sh = `#!/bin/sh
# Helix adapter. No Hector required.
# ${move} ${from} -> ${to}
set -e
HERE="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
BIN="$HERE/${name}"
if [ ! -f "$BIN" ]; then BIN="${path}"; fi
case "$(uname -s)" in
  Linux)
    if file "$BIN" 2>/dev/null | grep -qi PE32; then
      if command -v wine >/dev/null 2>&1; then exec wine "$BIN" "$@"; fi
      echo "Install wine to run this Windows program on Linux."; exit 2
    fi
    exec "$BIN" "$@"
    ;;
  Darwin)
    echo "Use Crapple or Wine. Helix will not fake a Mac rewrite."
    exit 2
    ;;
  *)
    exec "$BIN" "$@"
    ;;
esac
`;
  const bat = `@echo off
REM Helix adapter. No Hector required.
REM ${move} ${from} -> ${to}
set HERE=%~dp0
set BIN=%HERE%${name}
if not exist "%BIN%" set BIN=${path.replace(/\//g, "\\")}
where wsl >nul 2>&1
if %ERRORLEVEL%==0 (
  file "%BIN%" 2>nul | find /I "ELF" >nul
  if not errorlevel 1 (
    wsl -e "%BIN%" %*
    goto :eof
  )
)
"%BIN%" %*
`;
  return { sh, bat };
}
