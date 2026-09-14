#!/usr/bin/env bash
# Compile Godot + Unreal void shaders so the desk look is engine-backed.
# Headless. Does not cover the carousel. Never fail the session.
set +e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GODOT=""
for p in "${GODOT47:-}" /opt/godot/Godot "$HOME/.local/share/hector-build/runtime/godot/Godot" "$(command -v godot 2>/dev/null)"; do
  [ -n "${p:-}" ] && [ -x "$p" ] && GODOT="$p" && break
done
if [ -n "$GODOT" ]; then
  "$GODOT" --headless --path "$ROOT/Godot/void" --quit >/dev/null 2>&1
  "$GODOT" --headless --path "$ROOT/Godot" --quit >/dev/null 2>&1
fi
UE=""
for p in "${UE58:-}" /opt/unreal/Engine/Binaries/Linux/UnrealEditor "$HOME/UE_5.8/Engine/Binaries/Linux/UnrealEditor"; do
  [ -n "${p:-}" ] && [ -x "$p" ] && UE="$p" && break
done
if [ -n "$UE" ]; then
  "$UE" "$ROOT/UE/VoidDesktop/VoidDesktop.uproject" -run=ShaderCompileWorker -unattended -nopause >/dev/null 2>&1
fi
exit 0
