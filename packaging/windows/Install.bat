@echo off
cd /d "%~dp0"
echo Hector Build — Windows 11
echo If SmartScreen appears: More info, then Run anyway.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo Install failed. Need Node 22 from https://nodejs.org
  pause
  exit /b 1
)
echo.
pause
