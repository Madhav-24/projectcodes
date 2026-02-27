param(
    [string]$RepoPath = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)",
    [int]$DebounceSeconds = 60
)

Set-Location $RepoPath

# verify git repo; init if missing
git rev-parse --is-inside-work-tree > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No git repo found at $RepoPath — initializing..."
    git init
}

$watcher = New-Object System.IO.FileSystemWatcher $RepoPath -Property @{ 
    IncludeSubdirectories = $true
    NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, LastAccess, Size, DirectoryName'
    Filter = '*.*'
}

$timer = $null
$debounceMs = $DebounceSeconds * 1000

$commitAndPush = {
    Set-Location $RepoPath
    $status = git status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        git add -A
        git commit -m ("Auto update: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) 2>$null
        # Attempt push; if remote isn't set this will fail silently
        git push 2>$null
        Write-Host "Auto-pushed at $(Get-Date -Format 'HH:mm:ss')"
    }
}

$onChange = {
    if ($timer) { $timer.Stop(); $timer.Dispose() }
    $timer = New-Object System.Timers.Timer $debounceMs
    $timer.AutoReset = $false
    $timer.add_Elapsed({ $commitAndPush.Invoke() ; $timer.Dispose() })
    $timer.Start()
}

# Register events
Register-ObjectEvent $watcher Changed -Action $onChange | Out-Null
Register-ObjectEvent $watcher Created -Action $onChange | Out-Null
Register-ObjectEvent $watcher Deleted -Action $onChange | Out-Null
Register-ObjectEvent $watcher Renamed -Action $onChange | Out-Null

$watcher.EnableRaisingEvents = $true
Write-Host "Watching $RepoPath — changes will be committed/pushed after $DebounceSeconds s of inactivity. Ctrl-C to stop."

# Keep the script alive
while ($true) { Start-Sleep -Seconds 3600 }
