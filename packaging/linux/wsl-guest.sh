#!/usr/bin/env bash
# Runs inside WSL Ubuntu (or native Linux). Jobs: status | embed | packages | ollama | models | vllm | onion | revoke
set -euo pipefail
JOB="${1:-status}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MARK="$HOME/.hector-wsl-ready"

status_json() {
  echo "{\"ready\":$([ -f "$MARK" ] && echo true || echo false),\"root\":\"$ROOT\",\"apt\":$(command -v apt-get >/dev/null && echo true || echo false),\"nala\":$(command -v nala >/dev/null && echo true || echo false),\"pipx\":$(command -v pipx >/dev/null && echo true || echo false),\"tor\":$(command -v tor >/dev/null && echo true || echo false),\"ollama\":$(command -v ollama >/dev/null && echo true || echo false),\"node\":\"$(command -v node >/dev/null && node -v || echo none)\"}"
}

case "$JOB" in
  status)
    status_json
    ;;
  packages)
    bash "$ROOT/packaging/linux/apt-setup.sh"
    status_json
    ;;
  embed)
    mkdir -p "$HOME/.local/bin"
    bash "$ROOT/packaging/linux/apt-setup.sh" || true
    bash "$ROOT/packaging/linux/install-node22.sh" "$ROOT" || true
    bash "$ROOT/packaging/linux/onion-setup.sh" || true
    bash "$ROOT/packaging/linux/hector-keys-revoke.sh" install || true
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
  vllm)
    bash "$ROOT/packaging/linux/vllm-serve.sh" || true
    ;;
  onion)
    bash "$ROOT/packaging/linux/onion-setup.sh"
    ;;
  revoke)
    bash "$ROOT/packaging/linux/hector-keys-revoke.sh" run
    ;;
  *)
    echo "unknown job" >&2
    exit 2
    ;;
esac
