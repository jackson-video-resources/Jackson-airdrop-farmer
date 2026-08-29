# Decrypts the DPAPI-protected ENCRYPTION_KEY and puts it in $env:ENCRYPTION_KEY
# for this process (child processes inherit it; dotenv will not override it).
#
# The blob lives outside the repo at %LOCALAPPDATA%\airdrop-farm\enc.key and is
# bound to this Windows user account on this machine - copying it elsewhere
# yields nothing. Dot-source this file: . .\load-key.ps1
#
# Contains no secret itself; safe to commit.

Add-Type -AssemblyName System.Security

$script:KeyFile = Join-Path $env:LOCALAPPDATA "airdrop-farm\enc.key"

if (-not (Test-Path $script:KeyFile)) {
    throw "Key blob not found at $script:KeyFile. See docs/KEY-STORAGE.md to recreate it from the paper mnemonic."
}

try {
    $blob = [Convert]::FromBase64String((Get-Content -LiteralPath $script:KeyFile -Raw))
    $bytes = [Security.Cryptography.ProtectedData]::Unprotect(
        $blob, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    $env:ENCRYPTION_KEY = [Text.Encoding]::UTF8.GetString($bytes)
} catch {
    throw "Could not decrypt $($script:KeyFile). DPAPI blobs are bound to the Windows user account that created them - if the profile was rebuilt, recover from the paper mnemonic instead. ($($_.Exception.Message))"
}

if ($env:ENCRYPTION_KEY.Length -ne 64) {
    throw "Decrypted key is $($env:ENCRYPTION_KEY.Length) chars, expected 64."
}
