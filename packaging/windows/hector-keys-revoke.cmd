@echo off
REM Daily SSH key revocation. install: hector-keys-revoke.cmd install
set ROOT=%~dp0..\..
if /I "%~1"=="install" (
  schtasks /Create /TN "HectorKeysRevoke" /TR "\"%~f0\"" /SC DAILY /ST 03:00 /F >nul
  echo scheduled 03:00 daily
)
where wsl >nul 2>nul && (
  wsl -d Ubuntu -- bash "%ROOT:\=/%/packaging/linux/hector-keys-revoke.sh" run
  goto :eof
)
cd /d "%ROOT%"
node --experimental-strip-types src/lib/share/revoke-cli.ts
