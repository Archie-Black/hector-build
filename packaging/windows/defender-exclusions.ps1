# Requires Administrator. Adds Windows Defender exclusions for Hector Build only.
# Does not turn Defender off.
#Requires -RunAsAdministrator
param(
  [Parameter(Mandatory = $true)]
  [string]$Root
)

$ErrorActionPreference = "Stop"
if (-not (Get-Command Add-MpPreference -ErrorAction SilentlyContinue)) {
  Write-Host "Windows Defender cmdlets missing. Skip exclusions."
  exit 0
}

$Marker = Join-Path $env:LOCALAPPDATA "HectorBuild"
$Win = Join-Path $Root "packaging\windows"
$paths = @($Root, $Marker, $Win) | Where-Object { $_ -and (Test-Path $_) }
$procs = @(
  "node.exe",
  "npm.cmd",
  "npx.cmd",
  "electron.exe",
  "HectorBuild.exe",
  "HectorBuild-Setup.exe",
  "SpectralHX.exe"
)

foreach ($p in $paths) {
  Write-Host "ExclusionPath  $p"
  Add-MpPreference -ExclusionPath $p
}

foreach ($p in $procs) {
  Write-Host "ExclusionProcess  $p"
  Add-MpPreference -ExclusionProcess $p
}

Get-ChildItem -Path $Win -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(exe|ps1|bat|cmd)$' } |
  Unblock-File -ErrorAction SilentlyContinue

Write-Host "Defender exclusions set. Real-time protection stays on."
