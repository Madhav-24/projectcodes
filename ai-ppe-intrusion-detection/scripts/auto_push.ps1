param(
    [string]$RepoPath = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Definition)),
    [int]$DebounceSeconds = 60
)

Set-Location $RepoPath

# Verify git repo; init if missing
git rev-parse --is-inside-work-tree > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No git repo found at $RepoPath - initializing..."
    git init
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $RepoPath
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor `
                        [System.IO.NotifyFilters]::LastWrite -bor `
                        [System.IO.NotifyFilters]::DirectoryName
$watcher.Filter = '*.*'

$script:timer = $null
$debounceMs = $DebounceSeconds * 1000

function Invoke-CommitAndPush {
    Set-Location $RepoPath
    $status = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        git add -A
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        git commit -m "Auto update: $timestamp"
        git push
        Write-Host "Auto-pushed at $(Get-Date -Format 'HH:mm:ss')"
    } else {
        Write-Host "No changes detected at $(Get-Date -Format 'HH:mm:ss')"
    }
}

$action = {
    if ($script:timer) {
        $script:timer.Stop()
        $script:timer.Dispose()
        $script:timer = $null
    }
    $script:timer = New-Object System.Timers.Timer
    $script:timer.Interval = $debounceMs
    $script:timer.AutoReset = $false
    $script:timer.add_Elapsed({
        Invoke-CommitAndPush
        $script:timer.Dispose()
        $script:timer = $null
    })
    $script:timer.Start()
}

Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

$watcher.EnableRaisingEvents = $true

Write-Host "======================================================"
Write-Host " Auto-Push Watcher Started"
Write-Host " Repo   : $RepoPath"
Write-Host " Debounce: $DebounceSeconds seconds"
Write-Host " Press Ctrl+C to stop."
Write-Host "======================================================"

# Keep the script alive indefinitely
try {
    while ($true) { Start-Sleep -Seconds 10 }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host "Watcher stopped."
}
