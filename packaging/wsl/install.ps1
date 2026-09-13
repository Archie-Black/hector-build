# Full Arch WSL for OS V01D. Always installed. Distro name: OSV01D
$ErrorActionPreference = "Stop"
$Distro = "OSV01D"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Home = Join-Path $env:LOCALAPPDATA "OSV01D"
$Tar = Join-Path $Home "archlinux-bootstrap.tar.gz"

Write-Host "OS V01D: installing Arch Linux in WSL (always on)"
wsl --install --no-distribution 2>$null
wsl --set-default-version 2
New-Item -ItemType Directory -Force -Path $Home | Out-Null

if (-not (Test-Path $Tar)) {
  Write-Host "Fetching Arch bootstrap"
  Invoke-WebRequest -Uri "https://geo.mirror.pkgbuild.com/iso/latest/archlinux-bootstrap-x86_64.tar.gz" -OutFile $Tar
}

$listed = @(wsl -l -q)
if ($listed -notcontains $Distro) {
  wsl --import $Distro $Home $Tar --version 2
}

wsl --set-default $Distro
$unix = (wsl -d $Distro wslpath -a "$Root").Trim()
wsl -d $Distro -u root -- bash "$unix/packaging/wsl/setup.sh"

Write-Host "Arch WSL is installed and available as $Distro"
