import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";

const L2_CHAINS = ["base", "scroll", "linea", "zksync"];
const RESERVE_AMOUNT = ethers.parseEther("0.001");
const MIN_W00_BALANCE = ethers.parseEther("0.002");
const SKIP_THRESHOLD = ethers.parseEther("0.0005");

async function distribute() {
  const wallets = loadWallets();
  if (wallets.length < 2) {
    log.error("Need at least 2 wallets. Generate a fleet first.");
    process.exit(1);
  }

  const w00 = wallets[0];
  const recipients = wallets.slice(1);
  const w00Key = getPrivateKey(w00);

  log.info("Checking W00 balances...");
  log.divider();

  const summary: { chain: string; sent: number; total: bigint }[] = [];

  for (const chain of L2_CHAINS) {
    const provider = getProvider(chain);
    const balance = await provider.getBalance(w00.address);

    if (balance < MIN_W00_BALANCE) {
      log.warn(`  ${chain}: ${formatEth(balance)} ETH (too low, skipping)`);
      continue;
    }

    log.info(`  ${chain}: ${formatEth(balance)} ETH`);

    // Figure out which recipients need funding
    const needsFunding: typeof recipients = [];
    for (const r of recipients) {
      const rBal = await provider.getBalance(r.address);
      if (rBal > SKIP_THRESHOLD) {
        log.info(`  W${String(r.index).padStart(2, "0")} already has ${formatEth(rBal)} ETH, skipping`);
      } else {
        needsFunding.push(r);
      }
    }

    if (needsFunding.length === 0) {
      log.info(`  All recipients already funded on ${chain}, skipping`);
      continue;
    }

    const available = balance - RESERVE_AMOUNT;
    const perWallet = available / BigInt(needsFunding.length);

    log.info(`  Reserve ${formatEth(RESERVE_AMOUNT)} ETH for W00`);
    log.info(`  Available: ${formatEth(available)} ETH → ${formatEth(perWallet)} ETH each (${needsFunding.length} wallets)`);

    const signer = getSigner(chain, w00Key);
    let sentCount = 0;
    let sentTotal = 0n;

    for (const recipient of needsFunding) {
      const label = `W00 → W${String(recipient.index).padStart(2, "0")}`;
      try {
        const tx = await signer.sendTransaction({
          to: recipient.address,
          value: perWallet,
        });
        const receipt = await tx.wait();
        if (receipt && receipt.status === 1) {
          log.tx(tx.hash, `${label}: ${formatEth(perWallet)} ETH ✓`);
          sentCount++;
          sentTotal += perWallet;
        } else {
          log.error(`  ${label}: tx reverted`);
        }
      } catch (err: any) {
        log.error(`  ${label}: ${err.message ?? err}`);
      }
    }

    summary.push({ chain, sent: sentCount, total: sentTotal });
  }

  log.divider();
  log.info("Distribution summary:");
  for (const s of summary) {
    log.success(`  ${s.chain}: ${s.sent} transfers, ${formatEth(s.total)} ETH total`);
  }
  if (summary.length === 0) {
    log.warn("  No distributions made (all chains below threshold)");
  }
}

distribute().catch((err) => {
  log.error(`Fatal: ${err.message ?? err}`);
  process.exit(1);
});
