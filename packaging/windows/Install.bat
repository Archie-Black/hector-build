@echo off
cd /d "%~dp0"
if exist "%~dp0HectorBuild-Setup.exe" (
  start "" "%~dp0HectorBuild-Setup.exe"
  exit /b 0
)
echo HectorBuild-Setup.exe missing.
pause
