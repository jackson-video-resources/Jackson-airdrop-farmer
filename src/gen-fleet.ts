import "dotenv/config";
import { writeFileSync } from "fs";
import { generateFleet, saveFleet, loadWallets } from "./wallet-manager.js";
import { log } from "./utils/logger.js";

const count = Number(process.argv[2] ?? 3);
const OUT = "data/MNEMONIC-READ-THEN-DELETE.txt";

if (loadWallets().length > 0) {
  log.error("A fleet already exists. Refusing to overwrite (this would orphan any funds).");
  process.exit(1);
}

const { mnemonic, wallets } = generateFleet(count);
saveFleet(mnemonic, wallets);

// Mnemonic goes to a gitignored file ONLY — never to stdout.
writeFileSync(
  OUT,
  [
    "JACKSON AIRDROP FARM - MASTER MNEMONIC",
    "=".repeat(52),
    "",
    mnemonic,
    "",
    "=".repeat(52),
    "Write these 12 words on PAPER, then DELETE this file.",
    "They are the master key to every wallet in the fleet,",
    "including W03-W09 when you expand to 10 later.",
    "",
    "Addresses (public, safe to share):",
    ...wallets.map((w) => `  W${String(w.index).padStart(2, "0")}  ${w.address}`),
    "",
  ].join("\n"),
  "utf-8",
);

log.success(`Generated ${wallets.length} wallets (encrypted at rest).`);
for (const w of wallets) {
  log.info(`  W${String(w.index).padStart(2, "0")}  ${w.address}`);
}
log.warn(`Mnemonic written to ${OUT} — open it, copy to paper, then delete it.`);
