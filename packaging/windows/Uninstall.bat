@echo off
cd /d "%~dp0"
if exist "%~dp0HectorBuild-Uninstall.exe" (
  start "" "%~dp0HectorBuild-Uninstall.exe"
  exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
pause
