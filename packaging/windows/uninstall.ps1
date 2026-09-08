$ErrorActionPreference = "Continue"
$WslExe = Join-Path $env:SystemRoot "System32\wsl.exe"
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Hector Build"
$Desktop = [Environment]::GetFolderPath("Desktop")
$Marker = Join-Path $env:LOCALAPPDATA "HectorBuild"

if (Test-Path $WslExe) {
  & $WslExe -e bash -lc "if [ -f `$HOME/.local/share/hector-build/packaging/linux/uninstall.sh ]; then bash `$HOME/.local/share/hector-build/packaging/linux/uninstall.sh; fi"
}

if (Test-Path $StartMenu) { Remove-Item -Recurse -Force $StartMenu }
if (Test-Path $Marker) { Remove-Item -Recurse -Force $Marker }
Remove-Item -Force (Join-Path $Desktop "Hector Build.lnk") -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $Desktop "Spectral HX.lnk") -ErrorAction SilentlyContinue
Write-Host "Removed Hector Build / Spectral HX (WSL runtime + Windows shortcuts)."
