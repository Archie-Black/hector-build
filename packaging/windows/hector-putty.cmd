@echo off
REM Hector collab: open PuTTY / plink to another build bot.
REM Usage: hector-putty.cmd user@host [port]
set TARGET=%1
set PORT=%2
if "%PORT%"=="" set PORT=22
if "%TARGET%"=="" (
  echo Usage: hector-putty.cmd user@host [port]
  exit /b 1
)
where putty >nul 2>nul && (
  start "" putty -ssh %TARGET% -P %PORT%
  exit /b 0
)
where plink >nul 2>nul && (
  plink -ssh %TARGET% -P %PORT%
  exit /b 0
)
echo PuTTY is not installed.
start "" "https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html"
exit /b 1
