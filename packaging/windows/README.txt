Hector Build + Spectral HX — Windows 11
=======================================

Windows blocked it for two reasons:

1. The .exe is unsigned. SmartScreen says "Windows protected your PC".
   Click More info → Run anyway.

2. Old Setup required WSL. That is no longer required.

Install
-------
1. Unzip the GitHub source (the whole folder, not just the .exe).
   https://github.com/Archie-Black/hector-build/archive/refs/heads/main.zip
2. Install Node 22 LTS from https://nodejs.org if you do not have it.
3. Right-click packaging\windows\Install.bat → Run as administrator
   (admin is only for Defender exclusions; you can also run it normally
   and accept the UAC prompt when it appears).
4. If SmartScreen appears: More info → Run anyway.

Defender
--------
Install adds exclusions for this app only:

  - the unzipped Hector folder
  - %LOCALAPPDATA%\HectorBuild
  - packaging\windows
  - node.exe, npm, electron, HectorBuild.exe, SpectralHX.exe

Real-time protection stays on. Nothing else on the PC is excluded.

Re-run exclusions later (Administrator PowerShell):

  powershell -ExecutionPolicy Bypass -File packaging\windows\defender-exclusions.ps1 -Root <unzipped folder>

Then use Desktop / Start Menu → Hector Build or Spectral HX.

WSL is optional. Native Node + Electron is the Windows 11 path.
