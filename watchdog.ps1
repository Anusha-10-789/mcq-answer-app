# Checks whether the MCQ Answer App's backend (8000) and frontend (5173) are
# reachable, and restarts only whichever one has stopped. Safe to run repeatedly
# (idempotent) - intended to be invoked periodically by a Scheduled Task.
#
# Servers are launched via the Win32 CreateNoWindow flag (not Start-Process
# -WindowStyle Hidden) because Windows Terminal, when set as the default
# terminal app, can override -WindowStyle Hidden and show a window anyway.
# CreateNoWindow never allocates a console in the first place, so nothing is
# ever visible on screen. Output goes to logs/ instead.

$root = $PSScriptRoot
$logDir = Join-Path $root "logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

function Test-Port($port) {
    try {
        return (Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet)
    } catch {
        return $false
    }
}

function Start-Hidden($cmdFile) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $cmdFile
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null
}

if (-not (Test-Port 8000)) {
    Start-Hidden (Join-Path $root "run-backend.cmd")
}

if (-not (Test-Port 5173)) {
    Start-Hidden (Join-Path $root "run-frontend.cmd")
}
