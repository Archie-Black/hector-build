# Hector Build — native Windows 11 install. WSL is optional.
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Hector Build"
$Desktop = [Environment]::GetFolderPath("Desktop")
$Marker = Join-Path $env:LOCALAPPDATA "HectorBuild"

Write-Host "Hector Build — Windows 11 native install"
Write-Host "App folder: $Root"
Write-Host ""

Get-ChildItem -Path $PSScriptRoot -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -match '\.(exe|ps1|bat|cmd)$' } |
  Unblock-File -ErrorAction SilentlyContinue

function Add-HectorDefenderExclusions {
  $script = Join-Path $PSScriptRoot "defender-exclusions.ps1"
  if (-not (Test-Path $script)) { return }
  Write-Host "Windows Defender: adding exclusions for this app folder (admin prompt)..."
  try {
    $p = Start-Process -FilePath "powershell.exe" -Verb RunAs -Wait -PassThru -ArgumentList @(
      "-NoProfile",
      "-ExecutionPolicy Bypass",
      "-File `"$script`"",
      "-Root `"$Root`""
    )
    if ($p.ExitCode -eq 0) {
      Write-Host "Defender exclusions OK."
    } else {
      Write-Host "Defender exclusions skipped (exit $($p.ExitCode)). App still installs."
    }
  } catch {
    Write-Host "Defender exclusions skipped (need Administrator). App still installs."
  }
}

Add-HectorDefenderExclusions

function Have-Node {
  try {
    $v = (& node -v 2>$null)
    return $v -match "^v22"
  } catch { return $false }
}

if (-not (Have-Node)) {
  Write-Host "Node 22 not found. Installing with winget..."
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "Node 22 is required. Install it from https://nodejs.org (22 LTS), then run this Setup again."
  }
  & winget install -e --id OpenJS.NodeJS.22 --accept-package-agreements --accept-source-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  if (-not (Have-Node)) {
    throw "Node 22 still missing. Close this window, open a new PowerShell, and run packaging\windows\Install.bat again."
  }
}

Write-Host "Node $(node -v)"
Set-Location $Root
if (-not (Test-Path (Join-Path $Root "node_modules"))) {
  Write-Host "npm install (first run, a few minutes)..."
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed ($LASTEXITCODE)." }
}

New-Item -ItemType Directory -Force -Path $StartMenu, $Marker | Out-Null

$launcher = Join-Path $Marker "launch.cmd"
@"
@echo off
cd /d "$Root"
where node >nul 2>nul || (echo Node 22 missing. Install from https://nodejs.org & pause & exit /b 1)
start "" /min cmd /c "npm run dev"
timeout /t 4 /nobreak >nul
npx --yes electron desktop\main.mjs %*
"@ | Set-Content -Encoding ASCII $launcher

$hxLauncher = Join-Path $Marker "launch-hx.cmd"
@"
@echo off
cd /d "$Root"
start "" /min cmd /c "npm run dev"
timeout /t 4 /nobreak >nul
npx --yes electron desktop\main.mjs --hx
"@ | Set-Content -Encoding ASCII $hxLauncher

$Wsh = New-Object -ComObject WScript.Shell
function Shortcut($path, $target, $name) {
  $sc = $Wsh.CreateShortcut($path)
  $sc.TargetPath = $target
  $sc.WorkingDirectory = $Root
  $sc.WindowStyle = 7
  $sc.Description = $name
  $sc.Save()
}

Shortcut (Join-Path $StartMenu "Hector Build.lnk") $launcher "Hector Build"
Shortcut (Join-Path $StartMenu "Spectral HX.lnk") $hxLauncher "Spectral HX"
Shortcut (Join-Path $Desktop "Hector Build.lnk") $launcher "Hector Build"
Shortcut (Join-Path $Desktop "Spectral HX.lnk") $hxLauncher "Spectral HX"

@"
Native Windows 11 install.

Folder: $Root
Node: $(node -v)
WSL is not required.

Defender: exclusions are the app folder + node/electron, not Defender off.
If Windows blocked Setup.exe: More info → Run anyway (unsigned build).
"@ | Set-Content -Encoding ASCII (Join-Path $Marker "README.txt")

Write-Host ""
Write-Host "Installed."
Write-Host "  Desktop → Hector Build"
Write-Host "  Start Menu → Hector Build"
Write-Host "  Start Menu → Spectral HX"
