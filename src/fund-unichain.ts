import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { bridgeToUnichain } from "./protocols/bridge-unichain.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";

const BRIDGE_AMOUNT = ethers.parseEther(process.env.BRIDGE_AMOUNT_ETH || "0.015");
const MAINNET_BUFFER = ethers.parseEther(process.env.MAINNET_BUFFER_ETH || "0.005");
const W00_RESERVE = ethers.parseEther("0.001");
const SKIP_THRESHOLD = ethers.parseEther("0.0003");

async function waitForArrival(
  address: string,
  maxWaitMs = 600_000,
): Promise<boolean> {
  const provider = getProvider("unichain");
  const startBalance = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;

  log.info(
    `Waiting for bridge on Unichain (current: ${formatEth(startBalance)} ETH)...`,
  );

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15_000));
    const balance = await provider.getBalance(address);
    if (balance > startBalance) {
      log.success(
        `Bridge arrived on Unichain! Balance: ${formatEth(balance)} ETH`,
      );
      return true;
    }
    log.info(
      `Still waiting... (${Math.round((deadline - Date.now()) / 1000)}s left)`,
    );
  }

  log.warn(`Bridge didn't arrive within ${maxWaitMs / 1000}s`);
  return false;
}

async function main(): Promise<void> {
  const wallets = loadWallets();
  const w00 = wallets[0];
  if (!w00) {
    log.error("No wallets.");
    return;
  }

  const privateKey = getPrivateKey(w00);
  const ethSigner = getSigner("ethereum", privateKey);
  const address = await ethSigner.getAddress();

  // Check if already funded enough to distribute
  try {
    const uniProvider = getProvider("unichain");
    const uniBal = await uniProvider.getBalance(address);
    if (uniBal > ethers.parseEther("0.005")) {
      log.info(
        `Unichain already funded (${formatEth(uniBal)} ETH) — skipping to distribution`,
      );
      await distribute(wallets);
      return;
    }
  } catch {
    /* continue */
  }

  // Check mainnet balance
  const ethBalance = await getProvider("ethereum").getBalance(address);
  log.info(`W00 Ethereum balance: ${formatEth(ethBalance)} ETH`);

  if (ethBalance < BRIDGE_AMOUNT + MAINNET_BUFFER) {
    log.error(
      `Not enough ETH on mainnet (need ~${formatEth(BRIDGE_AMOUNT + MAINNET_BUFFER)})`,
    );
    return;
  }

  log.divider();
  log.info("Bridging ETH → Unichain via Relay...");
  try {
    await bridgeToUnichain(ethSigner, BRIDGE_AMOUNT);
    const arrived = await waitForArrival(address);

    if (arrived) {
      await distribute(wallets);
    } else {
      log.warn(
        "Bridge didn't arrive yet. Run this script again in a few minutes to distribute.",
      );
    }
  } catch (err: unknown) {
    log.error(
      `Bridge failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function distribute(
  wallets: ReturnType<typeof loadWallets>,
): Promise<void> {
  const w00 = wallets[0];
  const recipients = wallets.slice(1);
  const w00Key = getPrivateKey(w00);

  const provider = getProvider("unichain");
  const balance = await provider.getBalance(w00.address);

  log.divider();
  log.info(`W00 Unichain balance: ${formatEth(balance)} ETH`);

  if (balance < ethers.parseEther("0.003")) {
    log.warn("Balance too low to distribute");
    return;
  }

  const needsFunding: typeof recipients = [];
  for (const r of recipients) {
    const rBal = await provider.getBalance(r.address);
    if (rBal > SKIP_THRESHOLD) {
      log.info(
        `  W${String(r.index).padStart(2, "0")} already has ${formatEth(rBal)} ETH`,
      );
    } else {
      needsFunding.push(r);
    }
  }

  if (needsFunding.length === 0) {
    log.info("All wallets already funded on Unichain");
    return;
  }

  const available = balance - W00_RESERVE;
  const perWallet = available / BigInt(needsFunding.length);

  log.info(
    `Distributing ${formatEth(available)} ETH → ${formatEth(perWallet)} each (${needsFunding.length} wallets)`,
  );

  const signer = getSigner("unichain", w00Key);

  for (const recipient of needsFunding) {
    const label = `W00 → W${String(recipient.index).padStart(2, "0")}`;
    try {
      const tx = await signer.sendTransaction({
        to: recipient.address,
        value: perWallet,
      });
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        log.tx(tx.hash, `${label}: ${formatEth(perWallet)} ETH on Unichain`);
      } else {
        log.error(`${label}: reverted`);
      }
    } catch (err: unknown) {
      log.error(
        `${label}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  log.divider();
  log.success("Unichain distribution complete!");
}

main().catch((err) => {
  log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
