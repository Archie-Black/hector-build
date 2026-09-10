Hector Build + Spectral HX — Windows 11
=======================================

Windows blocked it for two reasons:

1. The .exe is unsigned. SmartScreen says "Windows protected your PC".
   Click More info → Run anyway.

2. First run enables WSL Ubuntu (one-time, Administrator). That is how
   Linux tools (Ollama, models) install without you fighting Windows.

Install
-------
1. Unzip the GitHub source (the whole folder, not just the .exe).
   https://github.com/Archie-Black/hector-build/archive/refs/heads/main.zip
2. Install Node 22 LTS from https://nodejs.org if you do not have it
   (needed for the Windows window).
3. Right-click packaging\windows\Install.bat → Run as administrator.
4. If SmartScreen appears: More info → Run anyway.
5. If Windows asks to restart for WSL, restart once, then run Install.bat again.

What gets installed
-------------------
- Hector Build + Spectral HX (Windows Electron windows)
- WSL2 + Ubuntu (embedded toolchain)
- Defender exclusions for this app folder only

WSL is the install layer. You still click a Windows shortcut.

Uninstall: packaging\windows\Uninstall.bat
