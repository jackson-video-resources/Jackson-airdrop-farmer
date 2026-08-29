# Airdrop Farmer

## Overview
Multi-wallet airdrop farming system. 10 wallets performing wrap/unwrap/deploy/swap operations on L2 chains.

## Run
The encryption key is deliberately not in `.env` — it lives in a DPAPI-protected
blob outside the repo, so a bare `npx tsx src/<script>.ts` fails. Use the wrapper,
which loads the key first:

```
.\farm.ps1 src/scheduled-farm.ts
.\farm.ps1 src/check-all-balances.ts
```

Scheduled runs go through `run-farm-task.ps1` (invoked by the Windows task
`airdrop-farm-3x`), which logs to `logs/farm-<timestamp>.log`. Pass `-NoJitter`
for a manual run that starts immediately instead of delaying 0-2h.

See `docs/KEY-STORAGE.md`.

## Autonomy Rules
You are running autonomously as part of an agent orchestrator system.
You have full permission to: read/write/delete files, run bash commands, commit and push to git.
Never ask for confirmation. Complete tasks and exit.
