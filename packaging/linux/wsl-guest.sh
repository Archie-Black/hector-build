#!/usr/bin/env bash
# Runs inside WSL Ubuntu (or native Linux). Jobs: status | embed | ollama | models
set -euo pipefail
JOB="${1:-status}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARK="$HOME/.hector-wsl-ready"

status_json() {
  echo "{\"ready\":$([ -f "$MARK" ] && echo true || echo false),\"root\":\"$ROOT\",\"ollama\":$(command -v ollama >/dev/null && echo true || echo false),\"node\":\"$(command -v node >/dev/null && node -v || echo none)\"}"
}

case "$JOB" in
  status)
    status_json
    ;;
  embed)
    mkdir -p "$HOME/.local/bin"
    if ! command -v curl >/dev/null 2>&1; then
      sudo apt-get update -y
      sudo apt-get install -y curl ca-certificates git
    fi
    bash "$ROOT/packaging/linux/install-node22.sh" "$ROOT" || true
    date -Iseconds > "$MARK"
    echo "WSL guest ready."
    status_json
    ;;
  ollama)
    if ! command -v ollama >/dev/null 2>&1; then
      curl -fsSL https://ollama.com/install.sh | sh
    fi
    nohup ollama serve >/tmp/hector-ollama.log 2>&1 &
    date -Iseconds > "$MARK"
    echo "Ollama on."
    ;;
  models)
    bash "$ROOT/packaging/linux/hector-home-models.sh" || true
    ;;
  *)
    echo "unknown job" >&2
    exit 2
    ;;
esac
