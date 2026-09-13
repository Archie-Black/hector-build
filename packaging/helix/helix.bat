@echo off
REM Helix. Standalone. No OS V01D required.
set BIN=%~1
if "%BIN%"=="" (
  echo helix: give me a program or its source.
  exit /b 2
)
shift
where wsl >nul 2>&1
if %ERRORLEVEL%==0 (
  wsl -e true >nul 2>&1
  if not errorlevel 1 (
    file "%BIN%" 2>nul | find /I "ELF" >nul
    if not errorlevel 1 (
      wsl -e "%BIN%" %*
      goto :eof
    )
  )
)
"%BIN%" %*
