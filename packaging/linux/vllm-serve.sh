#!/usr/bin/env bash
# vLLM OpenAI server on :8000. Same cluster as Ollama. Hector probes both.
set -euo pipefail

MODEL="${HECTOR_VLLM_MODEL:-Qwen/Qwen2.5-Coder-7B-Instruct}"
PORT="${HECTOR_VLLM_PORT:-8000}"
HOST="${HECTOR_VLLM_HOST:-127.0.0.1}"

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "No NVIDIA GPU. Use Ollama instead: packaging/linux/hector-home-models.sh"
  exit 1
fi

if ! python3 -c "import vllm" >/dev/null 2>&1; then
  python3 -m pip install --upgrade "vllm" || {
    echo "vLLM install failed. CUDA toolkit required."
    exit 1
  }
fi

EXTRA=()
case "$MODEL" in
  *DeepSeek*) EXTRA+=(--trust-remote-code) ;;
esac

echo "vLLM $MODEL on ${HOST}:${PORT}"
exec python3 -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --host "$HOST" \
  --port "$PORT" \
  "${EXTRA[@]}"
