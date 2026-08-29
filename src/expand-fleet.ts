import "dotenv/config";
import { expandFleet, loadWallets } from "./wallet-manager.js";
import { log } from "./utils/logger.js";

/** Expand the fleet to a target size, deriving new wallets from the same mnemonic. */
const target = Number(process.argv[2] ?? 10);
const current = loadWallets().length;

if (!Number.isInteger(target) || target < 1) {
  log.error(`Invalid target size: ${process.argv[2]}`);
  process.exit(1);
}

if (current === 0) {
  log.error("No fleet found. Generate one first (npx tsx src/index.ts → option 1).");
  process.exit(1);
}

if (target <= current) {
  log.info(`Fleet already has ${current} wallets — nothing to do.`);
  process.exit(0);
}

log.info(`Expanding fleet from ${current} → ${target} wallets...`);
const added = expandFleet(target - current);
for (const w of added) {
  log.success(`  W${String(w.index).padStart(2, "0")}  ${w.address}`);
}
log.success(`Fleet expanded to ${target}. Same mnemonic — no new backup needed.`);
