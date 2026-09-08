# Hector Build + Spectral HX — Windows install via WSL
# Unzip on NTFS, this script installs inside WSL and pins Windows shortcuts.

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Hector Build"
$Desktop = [Environment]::GetFolderPath("Desktop")
$Marker = Join-Path $env:LOCALAPPDATA "HectorBuild"
$WslExe = Join-Path $env:SystemRoot "System32\wsl.exe"

function Wsl([string]$cmd) {
  $out = & $WslExe -e bash -lc $cmd 2>&1
  $code = $LASTEXITCODE
  return @{ Text = (($out | Out-String).Trim()); Code = $code }
}

Write-Host "Hector Build Windows install uses WSL."
Write-Host "App runtime lives in Linux. Chrome/Edge windows open on Windows."
Write-Host ""

if (-not (Test-Path $WslExe)) {
  throw "wsl.exe not found. On Windows 10/11 run this as Administrator: wsl --install"
}

$probe = Wsl "echo HECTOR_WSL_OK"
if ($probe.Text -notmatch "HECTOR_WSL_OK") {
  Write-Host "No WSL distro yet. Installing Ubuntu (may need a reboot)..."
  & $WslExe --install -d Ubuntu
  throw "Finish Ubuntu first-run (username/password), reboot if asked, then run Install.bat again."
}

$winEsc = $Root.Replace("'", "'\''")
Write-Host "Installing into WSL from $Root"
$wslPath = ((& $WslExe -e wslpath -a $Root) | Out-String).Trim() -replace "`0", ""
if (-not $wslPath) { throw "Could not map $Root into WSL (wslpath failed)." }
$install = Wsl "set -euo pipefail; cd '$wslPath'; bash packaging/linux/install.sh"
Write-Host $install.Text
if ($install.Code -ne 0) { throw "WSL install failed ($($install.Code))." }

New-Item -ItemType Directory -Force -Path $StartMenu | Out-Null
New-Item -ItemType Directory -Force -Path $Marker | Out-Null
@"
Installed with WSL.

Runtime: ~/.local/share/hector-build inside your WSL distro
Windows windows: Chrome/Edge --app (localhost forwarded from WSL)

Launch: Start Menu → Hector Build / Spectral HX
Uninstall: packaging\windows\Uninstall.bat
"@ | Set-Content -Encoding ASCII (Join-Path $Marker "README.txt")

$Wsh = New-Object -ComObject WScript.Shell
function Shortcut($path, $args, $name) {
  $sc = $Wsh.CreateShortcut($path)
  $sc.TargetPath = $WslExe
  $sc.Arguments = $args
  $sc.WorkingDirectory = $env:USERPROFILE
  $sc.WindowStyle = 7
  $sc.Description = $name
  $sc.Save()
}

$hectorArgs = '-e bash -lc "export PATH=$HOME/.local/bin:$PATH; export NVM_DIR=$HOME/.nvm; [ -s $NVM_DIR/nvm.sh ] && . $NVM_DIR/nvm.sh; hector-build"'
$hxArgs = '-e bash -lc "export PATH=$HOME/.local/bin:$PATH; export NVM_DIR=$HOME/.nvm; [ -s $NVM_DIR/nvm.sh ] && . $NVM_DIR/nvm.sh; spectral-hx"'

Shortcut (Join-Path $StartMenu "Hector Build.lnk") $hectorArgs "Hector Build"
Shortcut (Join-Path $StartMenu "Spectral HX.lnk") $hxArgs "Spectral HX"
Shortcut (Join-Path $Desktop "Hector Build.lnk") $hectorArgs "Hector Build"
Shortcut (Join-Path $Desktop "Spectral HX.lnk") $hxArgs "Spectral HX"

Write-Host ""
Write-Host "Installed with WSL."
Write-Host "  Start Menu → Hector Build"
Write-Host "  Start Menu → Spectral HX"
Write-Host "  Desktop shortcuts created"
Write-Host ""
Write-Host "Each shortcut starts the WSL runtime and opens a full Windows app window."
