#!/usr/bin/env bash
# From Linux or an existing WSL. Makes Arch the OSV01D distro and finishes setup.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if grep -qi microsoft /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; then
  sudo bash "$ROOT/packaging/wsl/setup.sh"
  echo "Arch WSL is installed and available."
  exit 0
fi
if command -v wsl.exe >/dev/null 2>&1; then
  wsl.exe --set-default-version 2 || true
  echo "On Windows, run packaging/wsl/install.ps1 as Administrator once."
  echo "This tree is ready. Distro name: OSV01D"
  exit 0
fi
echo "Not on Windows. Native Arch install is packaging/arch/bootstrap.sh"
echo "WSL scripts still ship so a Windows box can take this tree and install the room."
exit 0
