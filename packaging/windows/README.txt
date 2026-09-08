Hector Build + Spectral HX — Windows
====================================

Spectral HX is a desktop IDE (VS Code chrome: Monaco editor, Git, debug,
terminal, extensions) plus Hector host chat.

Native (no WSL, Electron):
  npm install
  npm run desktop:hx

Or double-click after Setup:

  HectorBuild-Setup.exe      first-time install
  HectorBuild.exe            host window
  SpectralHX.exe             coding floor

Node 22 is bundled in runtime/node.

WSL is optional (Linux tools). The IDE itself is native Chromium + Node.

npm run desktop:win   → Windows zip
npm run desktop:linux → AppImage + deb
