# Wrapper invoked by Windows Task Scheduler to run one farming cycle.
# Logs to logs\farm-<timestamp>.log so results survive for later inspection.
#
# Jitter is ON by default: scheduled-farm.ts delays 0-2h before starting, so
# runs don't land on the same wall-clock minute every day. Pass -NoJitter for
# manual/verification runs where you want it to start immediately.

param([switch]$NoJitter)

$ErrorActionPreference = "Continue"
$repo = "C:\Users\warre\jackson-airdrop-farm"
Set-Location $repo

$logDir = Join-Path $repo "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$log = Join-Path $logDir "farm-$stamp.log"

function Write-Log([string]$line) {
    # Explicit utf8 everywhere; Tee-Object -Append defaults to UTF-16 on PS 5.1.
    $line | Out-File -FilePath $log -Append -Encoding utf8
}

Write-Log "=== farm cycle started $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss')) UTC ==="
Write-Log "cwd: $(Get-Location)  user: $env:USERNAME"

# ENCRYPTION_KEY is not in .env; decrypt it from the DPAPI blob outside the repo.
# Sets $env:ENCRYPTION_KEY for this process only - npx inherits it. Never logged.
try {
    . (Join-Path $repo "load-key.ps1")
    Write-Log "encryption key loaded from DPAPI blob (len $($env:ENCRYPTION_KEY.Length))"
} catch {
    Write-Log "FATAL: could not load encryption key - $($_.Exception.Message)"
    exit 1
}

# 2>&1 turns native stderr into ErrorRecords; ToString() flattens them so npm's
# harmless notices don't surface as NativeCommandError noise.
$farmArgs = @("tsx", "src/scheduled-farm.ts")
if ($NoJitter) { $farmArgs += "--no-jitter" }
Write-Log "invoking: npx $($farmArgs -join ' ')"

& "C:\Program Files\nodejs\npx.cmd" @farmArgs 2>&1 |
    ForEach-Object {
        $text = $_.ToString()
        Write-Host $text
        Write-Log $text
    }

Write-Log "=== farm cycle finished $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss')) UTC (exit $LASTEXITCODE) ==="
