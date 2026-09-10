#!/usr/bin/env bash
# Pull the home-cluster set. 7B scout + 14/32B coder. No xAI required.
set -euo pipefail
command -v ollama >/dev/null || { echo "Install Ollama first: https://ollama.com/download"; exit 1; }
ollama pull qwen2.5-coder:7b
ollama pull qwen2.5-coder:14b || ollama pull qwen2.5-coder:7b
ollama pull qwen2.5-coder:32b || true
ollama pull granite4.2:8b || true
ollama pull granite4.2:3b || true
echo "Hector will pick the strongest coder/Granite on this box. Keep Ollama running."
