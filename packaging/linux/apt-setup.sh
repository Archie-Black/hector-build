#!/usr/bin/env bash
# Configure Ubuntu package managers for Hector: apt (all pockets), nala, pipx.
# Snap only if systemd is actually running (WSL often is not).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export APT_LISTCHANGES_FRONTEND=none

as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -n "$@" 2>/dev/null || sudo "$@"
  else
    echo "need root for apt" >&2
    return 1
  fi
}

as_root mkdir -p /etc/apt/apt.conf.d /etc/apt/sources.list.d

as_root tee /etc/apt/apt.conf.d/99hector >/dev/null <<'EOF'
APT::Get::Assume-Yes "true";
APT::Get::Fix-Broken "true";
APT::Install-Recommends "false";
APT::Install-Suggests "false";
Dpkg::Use-Pty "0";
Dpkg::Progress-Fancy "0";
Acquire::Retries "3";
EOF

enable_pockets() {
  local src="/etc/apt/sources.list.d/ubuntu.sources"
  if [ -f "$src" ]; then
    as_root sed -i 's/^Components:.*/Components: main restricted universe multiverse/' "$src"
    return
  fi
  if [ -f /etc/apt/sources.list ]; then
    as_root sed -i -E 's/^#[[:space:]]*deb /deb /' /etc/apt/sources.list
  fi
  if command -v add-apt-repository >/dev/null 2>&1; then
    as_root add-apt-repository -y universe || true
    as_root add-apt-repository -y multiverse || true
    as_root add-apt-repository -y restricted || true
  fi
}

enable_pockets

as_root dpkg --configure -a || true
as_root apt-get update -y

BASE_PKGS=(
  apt-utils
  software-properties-common
  apt-transport-https
  ca-certificates
  curl
  git
  gnupg
  unzip
  jq
  build-essential
  python3
  python3-pip
  python3-venv
  python3-dev
  pipx
)

as_root apt-get install -y "${BASE_PKGS[@]}" || as_root apt-get install -y --fix-missing "${BASE_PKGS[@]}" || true

enable_pockets
as_root apt-get update -y || true

if ! command -v nala >/dev/null 2>&1; then
  as_root apt-get install -y nala || true
fi
if command -v nala >/dev/null 2>&1; then
  as_root nala fetch --auto --https-only -y 2>/dev/null || as_root nala fetch --auto -y 2>/dev/null || true
fi

if command -v pipx >/dev/null 2>&1; then
  pipx ensurepath >/dev/null 2>&1 || true
fi

if [ -d /run/systemd/system ] && command -v snap >/dev/null 2>&1; then
  as_root snap wait system seed.loaded 2>/dev/null || true
fi

echo "package-managers: apt=$(command -v apt-get >/dev/null && echo on || echo off) nala=$(command -v nala >/dev/null && echo on || echo off) pipx=$(command -v pipx >/dev/null && echo on || echo off)"
