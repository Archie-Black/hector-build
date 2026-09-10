#!/usr/bin/env bash
# Home cluster: Ollama first. 7B coder on any box. 14B if RAM. DeepSeek-Coder-V2-Lite for repo-wide.
set -euo pipefail
command -v ollama >/dev/null || { echo "Install Ollama first: https://ollama.com/download"; exit 1; }

ollama pull qwen2.5-coder:7b

kb=$(awk '/MemTotal/ { print $2 }' /proc/meminfo 2>/dev/null || echo 0)
if [ "${kb:-0}" -ge 16000000 ]; then
  ollama pull qwen2.5-coder:14b || ollama pull qwen2.5-coder:7b
else
  echo "Under 16G RAM — keeping Qwen2.5-Coder 7B. 14B skipped."
fi

ollama pull deepseek-coder-v2:16b-lite-instruct || ollama pull deepseek-coder-v2 || true
ollama pull granite4.2:8b || true

echo "Ollama tags:"
ollama list || true
echo "Hector picks the strongest coder on this box. Keep Ollama running."
echo "GPU box?  packaging/linux/vllm-serve.sh"
