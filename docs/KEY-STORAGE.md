# Encryption key storage

## What changed and why

`data/wallets.enc.json` is AES-256-GCM encrypted, but the key that decrypts it
used to sit in `.env` in the same folder. Anything that copied both files -- a
repo backup, a zip, a synced folder, or the `scp` in the deployment guide's
step 9 -- handed over the wallets and the key together, which made the
encryption decorative.

The key now lives outside the repo, encrypted with Windows DPAPI:

```
%LOCALAPPDATA%\airdrop-farm\enc.key
```

DPAPI (`CurrentUser` scope) binds the blob to the `warre` Windows account on
this machine. Copying `enc.key` to another machine or another user account
yields nothing usable.

## Running scripts

`.env` no longer contains `ENCRYPTION_KEY`, so a bare invocation fails:

```powershell
npx tsx src/verify-fleet.ts        # fails - no key
```

Use the helper, which decrypts the blob into the child process's environment:

```powershell
.\farm.ps1 src/verify-fleet.ts
.\farm.ps1 src/check-all-balances.ts
.\farm.ps1 src/scheduled-farm.ts --no-jitter
```

The scheduled task (`airdrop-farm-test`) calls `run-farm-task.ps1`, which
dot-sources `load-key.ps1` for the same effect. The key is never written to a
log file.

## What this does and does not protect against

Protects against: repo backups, folder syncing, copying `data/` off the
machine, and shipping both files to a rented VPS. Someone who obtains
`wallets.enc.json` alone cannot decrypt it.

Does **not** protect against: code running as `warre` on this machine. Any
process under this account can call the same DPAPI unprotect. Unattended
farming requires the key be available without a human present, so no design
removes this -- the mitigation is to keep only test-sized amounts in the fleet.

## Recovery

The DPAPI blob is machine-and-account bound by design. If Windows is
reinstalled, the profile is rebuilt, or the blob is deleted, it cannot be
recovered -- and `wallets.enc.json` becomes permanently undecryptable.

**This is not a loss of funds.** The 12-word mnemonic on paper is the real
backup. To recover:

1. Generate a new 32-byte key: `openssl rand -hex 32` (or `node -e
   "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. Re-import the fleet from the paper mnemonic.
3. Re-protect the new key into `%LOCALAPPDATA%\airdrop-farm\enc.key` using the
   `ProtectedData.Protect` call shown in `load-key.ps1` (in reverse).

Keep the paper copy. It outranks everything here.

## If you later deploy to a VPS (step 9)

Do not `scp` the key alongside `wallets.enc.json`. The Linux equivalent of this
setup is a systemd `LoadCredential=` entry or a root-owned `0400` key file
outside the deploy directory, injected as an environment variable at service
start.
