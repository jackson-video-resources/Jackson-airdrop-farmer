import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { bridgeToL2 } from "./protocols/bridge-official.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";
import { logTaskCost } from "./cost-logger.js";

const BRIDGE_AMOUNT = ethers.parseEther("0.002"); // 0.002 ETH per chain
const CHAINS_TO_FUND = ["scroll", "linea", "zksync", "arbitrum", "optimism"];

/** Wait for bridged ETH to arrive on L2 */
async function waitForBridgeArrival(
  chain: string,
  address: string,
  maxWaitMs: number = 600_000
): Promise<void> {
  const provider = getProvider(chain);
  const startBalance = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;

  log.info(`Waiting for bridge deposit on ${chain} (current: ${formatEth(startBalance)} ETH)...`);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 30_000));
    const balance = await provider.getBalance(address);
    if (balance > startBalance) {
      log.success(`Bridge arrived on ${chain}! Balance: ${formatEth(balance)} ETH`);
      return;
    }
    log.info(`Still waiting on ${chain}... (${Math.round((deadline - Date.now()) / 1000)}s left)`);
  }

  log.warn(`Bridge to ${chain} didn't arrive within ${maxWaitMs / 1000}s. Check manually.`);
}

async function main(): Promise<void> {
  const wallets = loadWallets();
  const w0 = wallets[0];
  if (!w0) {
    log.error("No wallets found.");
    return;
  }

  const privateKey = getPrivateKey(w0);
  const signer = getSigner("ethereum", privateKey);
  const address = await signer.getAddress();

  // Check Ethereum balance first
  const ethProvider = getProvider("ethereum");
  const ethBalance = await ethProvider.getBalance(address);
  log.info(`W00 (${address.slice(0, 10)}...) Ethereum balance: ${formatEth(ethBalance)} ETH`);

  const totalNeeded = BRIDGE_AMOUNT * BigInt(CHAINS_TO_FUND.length);
  if (ethBalance < totalNeeded) {
    log.error(`Need ~${formatEth(totalNeeded)} ETH for ${CHAINS_TO_FUND.length} bridges, only have ${formatEth(ethBalance)} ETH`);
    return;
  }

  log.divider();
  log.info(`Funding ${CHAINS_TO_FUND.length} chains with ${formatEth(BRIDGE_AMOUNT)} ETH each...`);
  log.divider();

  for (const chain of CHAINS_TO_FUND) {
    // Check if already funded
    try {
      const l2Provider = getProvider(chain);
      const l2Balance = await l2Provider.getBalance(address);
      if (l2Balance > ethers.parseEther("0.001")) {
        log.info(`${chain} already has ${formatEth(l2Balance)} ETH — skipping bridge`);
        continue;
      }
    } catch {
      // Can't check — proceed with bridge
    }

    log.info(`Bridging ${formatEth(BRIDGE_AMOUNT)} ETH → ${chain}...`);

    try {
      const txHash = await bridgeToL2(signer, chain, BRIDGE_AMOUNT);
      log.tx(txHash, `Bridge to ${chain}`);

      // Log cost to dashboard
      logTaskCost("ethereum", txHash, "bridge", "wallet-0", `Bridge ETH → ${chain}`).catch(() => {});

      // Wait for arrival
      await waitForBridgeArrival(chain, address);
    } catch (err: unknown) {
      log.error(`Bridge to ${chain} failed: ${err instanceof Error ? err.message : String(err)}`);
      log.warn(`Continuing to next chain...`);
    }

    // Small delay between bridges
    await new Promise((r) => setTimeout(r, 15_000));
  }

  // Print final balances
  log.divider();
  log.info("Final balances:");
  for (const chain of ["ethereum", "base", ...CHAINS_TO_FUND]) {
    try {
      const provider = getProvider(chain);
      const balance = await provider.getBalance(address);
      log.info(`  ${chain}: ${formatEth(balance)} ETH`);
    } catch {
      log.info(`  ${chain}: error checking`);
    }
  }
  log.divider();
  log.success("Funding complete!");
}

main().catch(console.error);
