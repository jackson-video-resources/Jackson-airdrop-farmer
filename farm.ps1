# Manual-run helper. The encryption key is no longer in .env, so bare
#   npx tsx src/<script>.ts
# will fail. Use this instead:
#   .\farm.ps1 src/verify-fleet.ts
#   .\farm.ps1 src/check-all-balances.ts
#   .\farm.ps1 src/scheduled-farm.ts --no-jitter

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Script,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

. (Join-Path $PSScriptRoot "load-key.ps1")

& "C:\Program Files\nodejs\npx.cmd" tsx $Script @Args
exit $LASTEXITCODE
