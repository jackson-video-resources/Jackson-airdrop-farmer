import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { bridgeViaRelay } from "./protocols/bridge-unichain.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";

/**
 * Bridge ETH from mainnet to the new-wave chains and spread it across the
 * fleet, so every wallet — not just W00 — can farm there.
 *
 * Pass --dry-run to print the resolved plan without signing anything.
 */

/** Per-chain bridge budget. Resolved value is printed before anything signs. */
const PER_CHAIN = ethers.parseEther(process.env.FUND_PER_CHAIN_ETH || "0.035");
/** Left on W00 for gas on each chain after distributing. */
const W00_RESERVE = ethers.parseEther("0.001");
/** Recipients above this already have a working balance. */
const SKIP_THRESHOLD = ethers.parseEther("0.0003");
/** W00 above this on a chain means the bridge leg is already done. */
const ALREADY_BRIDGED = ethers.parseEther("0.001");
/** Kept on mainnet; below 0.01 the occasional EigenLayer task stops firing. */
const MAINNET_BUFFER = ethers.parseEther(
  process.env.FUND_MAINNET_BUFFER_ETH || "0.02",
);

const CHAINS_TO_FUND = ["megaeth", "abstract", "unichain"];
const DRY_RUN = process.argv.includes("--dry-run");

async function waitForArrival(
  chain: string,
  address: string,
  maxWaitMs = 600_000,
): Promise<boolean> {
  const provider = getProvider(chain);
  const start = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;
  log.info(`Waiting for arrival on ${chain} (current: ${formatEth(start)} ETH)...`);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15_000));
    const bal = await provider.getBalance(address);
    if (bal > start) {
      log.success(`Arrived on ${chain}! Balance: ${formatEth(bal)} ETH`);
      return true;
    }
    log.info(`Still waiting on ${chain}... (${Math.round((deadline - Date.now()) / 1000)}s left)`);
  }
  log.warn(`Bridge to ${chain} didn't arrive within ${maxWaitMs / 1000}s`);
  return false;
}

/**
 * Spread W00's balance on `chain` across the wallets that are short.
 * Gas is estimated per chain — Abstract is ZK Stack and costs far more than
 * the 21000 a plain L1 transfer would.
 */
async function distribute(
  chain: string,
  wallets: ReturnType<typeof loadWallets>,
): Promise<void> {
  const [w00, ...recipients] = wallets;
  const provider = getProvider(chain);
  const balance = await provider.getBalance(w00.address);

  log.info(`W00 ${chain} balance: ${formatEth(balance)} ETH`);
  if (balance <= W00_RESERVE) {
    log.warn(`Nothing to distribute on ${chain}`);
    return;
  }

  const short: typeof recipients = [];
  for (const r of recipients) {
    const bal = await provider.getBalance(r.address);
    if (bal > SKIP_THRESHOLD) {
      log.info(`  W${String(r.index).padStart(2, "0")} already has ${formatEth(bal)} ETH`);
    } else {
      short.push(r);
    }
  }

  if (short.length === 0) {
    log.info(`All wallets already funded on ${chain}`);
    return;
  }

  const perWallet = (balance - W00_RESERVE) / BigInt(short.length);
  log.info(
    `Distributing ${formatEth(balance - W00_RESERVE)} ETH → ${formatEth(perWallet)} each (${short.length} wallets) on ${chain}`,
  );

  if (DRY_RUN) return;

  const signer = getSigner(chain, getPrivateKey(w00));
  for (const r of short) {
    const label = `W00 → W${String(r.index).padStart(2, "0")} on ${chain}`;
    try {
      const tx = await signer.sendTransaction({ to: r.address, value: perWallet });
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        log.tx(tx.hash, `${label}: ${formatEth(perWallet)} ETH`);
      } else {
        log.error(`${label}: reverted — stopping on this chain`);
        return;
      }
    } catch (err) {
      // First failure on a chain usually means every transfer will fail the
      // same way (gas model, RPC); don't burn nine of them finding out.
      log.error(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      log.warn(`Stopping distribution on ${chain}`);
      return;
    }
  }
  log.success(`Distribution complete on ${chain}`);
}

async function main(): Promise<void> {
  const wallets = loadWallets();
  const w00 = wallets[0];
  if (!w00) return log.error("No wallets found.");

  const key = getPrivateKey(w00);
  const l1Signer = getSigner("ethereum", key);
  const address = await l1Signer.getAddress();
  const l1Balance = await getProvider("ethereum").getBalance(address);

  log.divider();
  log.info(DRY_RUN ? "DRY RUN — nothing will be signed" : "LIVE RUN");
  log.info(`W00: ${address}`);
  log.info(`Mainnet balance   : ${formatEth(l1Balance)} ETH`);
  log.info(`Per chain (resolved): ${formatEth(PER_CHAIN)} ETH  [FUND_PER_CHAIN_ETH=${process.env.FUND_PER_CHAIN_ETH ?? "unset, default 0.035"}]`);
  log.info(`Mainnet buffer    : ${formatEth(MAINNET_BUFFER)} ETH`);
  log.info(`Chains            : ${CHAINS_TO_FUND.join(", ")}`);
  log.divider();

  // Which chains actually need the bridge leg?
  const needBridge: string[] = [];
  for (const chain of CHAINS_TO_FUND) {
    try {
      const bal = await getProvider(chain).getBalance(address);
      if (bal > ALREADY_BRIDGED) {
        log.info(`${chain}: W00 already holds ${formatEth(bal)} ETH — skipping bridge`);
      } else {
        needBridge.push(chain);
        log.info(`${chain}: W00 holds ${formatEth(bal)} ETH — will bridge ${formatEth(PER_CHAIN)}`);
      }
    } catch (err) {
      log.error(`${chain}: cannot reach RPC — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const totalBridge = PER_CHAIN * BigInt(needBridge.length);
  log.divider();
  log.info(`Bridging to ${needBridge.length} chain(s): total ${formatEth(totalBridge)} ETH`);
  log.info(`Mainnet after     : ~${formatEth(l1Balance - totalBridge)} ETH (excl. gas)`);

  if (l1Balance < totalBridge + MAINNET_BUFFER) {
    return log.error(
      `Need ${formatEth(totalBridge + MAINNET_BUFFER)} ETH on mainnet (bridge + buffer), have ${formatEth(l1Balance)}`,
    );
  }

  for (const chain of needBridge) {
    log.divider();
    if (DRY_RUN) {
      log.info(`[dry-run] would bridge ${formatEth(PER_CHAIN)} ETH ethereum → ${chain} via Relay`);
      continue;
    }
    try {
      await bridgeViaRelay(l1Signer, "ethereum", chain, PER_CHAIN);
      if (!(await waitForArrival(chain, address))) {
        log.warn(`Skipping distribution on ${chain} — funds not visible yet`);
        continue;
      }
    } catch (err) {
      log.error(`Bridge to ${chain} failed: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
  }

  for (const chain of CHAINS_TO_FUND) {
    log.divider();
    log.info(`--- distribute on ${chain} ---`);
    try {
      await distribute(chain, wallets);
    } catch (err) {
      log.error(`Distribution on ${chain} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  log.divider();
  log.success(DRY_RUN ? "Dry run complete — nothing signed" : "Funding complete!");
}

main().catch((err) => {
  log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
