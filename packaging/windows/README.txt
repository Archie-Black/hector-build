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
3. Double-click packaging\windows\HectorBuild-Setup.exe
   or packaging\windows\Install.bat
4. If SmartScreen appears: More info → Run anyway.

Then use Desktop / Start Menu → Hector Build or Spectral HX.

WSL is optional. Native Node + Electron is the Windows 11 path.
