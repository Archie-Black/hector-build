# Embed WSL2 + Ubuntu as Hector's Windows install layer.
# Electron stays a Windows window. Linux tools run in Ubuntu.
$ErrorActionPreference = "Continue"
$Root = if ($args.Count -ge 1) { $args[0] } else { (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }
$Marker = Join-Path $env:LOCALAPPDATA "HectorBuild"
$Wsl = Join-Path $env:SystemRoot "System32\wsl.exe"
New-Item -ItemType Directory -Force -Path $Marker | Out-Null

function To-WslPath([string]$p) {
  if ($p -match '^([A-Za-z]):\\(.*)$') {
    $drive = $Matches[1].ToLower()
    $rest = $Matches[2] -replace '\\','/'
    return "/mnt/$drive/$rest"
  }
  return ($p -replace '\\','/')
}

Write-Host "Hector — embedding WSL Ubuntu"

if (-not (Test-Path $Wsl)) {
  Write-Host "Enabling Windows Subsystem for Linux..."
  try {
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart -ErrorAction SilentlyContinue | Out-Null
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart -ErrorAction SilentlyContinue | Out-Null
  } catch { }
  try { & $Wsl --install --no-distribution } catch { }
}

if (Test-Path $Wsl) {
  try { & $Wsl --set-default-version 2 } catch { }
  $list = & $Wsl -l -q 2>$null | Out-String
  if ($list -notmatch "Ubuntu") {
    Write-Host "Installing Ubuntu (one-time)..."
    try { & $Wsl --install -d Ubuntu --no-launch } catch { & $Wsl --install -d Ubuntu }
  }
  try { & $Wsl --set-default Ubuntu } catch { }

  $guest = (To-WslPath $Root) + "/packaging/linux/wsl-guest.sh"
  Write-Host "Preparing Ubuntu guest..."
  & $Wsl -d Ubuntu -- bash "$guest" embed
  $ok = $LASTEXITCODE -eq 0

  @{
    distro = "Ubuntu"
    root = $Root
    guest = $guest
    ready = [bool]$ok
    at = (Get-Date).ToString("o")
  } | ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $Marker "wsl.json")

  if ($ok) {
    Write-Host "WSL Ubuntu is embedded. Ollama and Linux installs run there."
    exit 0
  }
  Write-Host "WSL is on this PC. If Ubuntu is still installing, restart once, then run Install.bat again."
  exit 0
}

Write-Host "Could not enable WSL. Hector still runs with native Node. Linux tools need WSL."
exit 0
