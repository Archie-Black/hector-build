#!/usr/bin/env bash
set -euo pipefail
PREFIX="${XDG_DATA_HOME:-$HOME/.local/share}"
BIN="${XDG_BIN_HOME:-$HOME/.local/bin}"
rm -rf "$PREFIX/hector-build"
rm -f "$BIN/hector-build" "$BIN/spectral-hx"
rm -f "$PREFIX/applications/hector-build.desktop" "$PREFIX/applications/spectral-hx.desktop"
rm -f "$PREFIX/icons/hicolor/256x256/apps/hector-build.png" "$PREFIX/icons/hicolor/256x256/apps/spectral-hx.png"
echo "Removed Hector Build and Spectral HX."
