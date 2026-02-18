import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getProvider } from "./chains/index.js";
import { safeExecuteTask, sendSessionSummary } from "./safety/index.js";
import { generatePersonality, shouldBeActive, getDelay } from "./tasks/personality.js";
import { randInt, shuffle, pickRandom, jitterAmount, randomSleep, describeDelay } from "./utils/random.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";
import type { Task } from "./tasks/types.js";
import { PENDLE_MARKETS } from "./protocols/pendle.js";

/** Minimum balance to farm on a chain (0.0005 ETH) */
const MIN_BALANCE = ethers.parseEther("0.0005");

/** Amount per task (0.0003 ETH — small to preserve funds) */
const TASK_AMOUNT = ethers.parseEther("0.0003");

/** L2 chains we farm on */
const L2_CHAINS = ["base", "scroll", "linea", "zksync", "arbitrum", "optimism"];

/** DEX protocol per chain */
const DEX_PROTOCOL: Record<string, string> = {
  base: "uniswap-v3",
  scroll: "syncswap",
  linea: "syncswap",
  zksync: "syncswap",
  arbitrum: "uniswap-v3",
  optimism: "velodrome",
};

/** Alternate DEX per chain (for diversity) */
const ALT_DEX: Record<string, string> = {
  base: "aerodrome",
  scroll: "ambient",
};

/** Chains with Aave V3 */
const AAVE_CHAINS = new Set(["base", "scroll", "linea", "arbitrum", "optimism"]);

/** Available task templates for L2 activity (no bridge) */
function getTaskPool(chain: string): Task[] {
  const protocol = DEX_PROTOCOL[chain];
  return [
    { type: "wrap_eth", chain, params: {}, description: `Wrap ETH → WETH on ${chain}` },
    { type: "unwrap_eth", chain, params: {}, description: `Unwrap WETH → ETH on ${chain}` },
    { type: "dex_swap", chain, protocol, params: { tokenIn: "ETH", tokenOut: "USDC" }, description: `Swap ETH → USDC on ${chain} (${protocol})` },
    { type: "dex_swap", chain, protocol, params: { tokenIn: "USDC", tokenOut: "ETH" }, description: `Swap USDC → ETH on ${chain} (${protocol})` },
    { type: "deploy_contract", chain, params: {}, description: `Deploy contract on ${chain}` },
  ];
}

/** Chains where DEX swaps are confirmed working */
const SWAP_CHAINS = new Set(["base", "scroll", "linea", "zksync", "arbitrum", "optimism"]);

/** Pick a random set of 2-5 tasks for a chain */
function pickTasks(chain: string): Task[] {
  const canSwap = SWAP_CHAINS.has(chain);
  const doSwapRoundTrip = canSwap && Math.random() < 0.6;
  const doWrapUnwrap = Math.random() < 0.7;
  const doDeploy = Math.random() < 0.12;
  const doAave = AAVE_CHAINS.has(chain) && Math.random() < 0.3;
  const doAltDex = ALT_DEX[chain] && Math.random() < 0.25;
  const doOrbiterBridge = Math.random() < 0.15;
  const doZoraMint = chain === "base" && Math.random() < 0.1;

  const protocol = DEX_PROTOCOL[chain];
  const tasks: Task[] = [];

  if (doWrapUnwrap) {
    tasks.push({ type: "wrap_eth", chain, params: {}, description: `Wrap ETH → WETH on ${chain}` });
  }

  if (doSwapRoundTrip) {
    const dex = doAltDex ? ALT_DEX[chain] : protocol;
    tasks.push(
      { type: "dex_swap", chain, protocol: dex, params: { tokenIn: "ETH", tokenOut: "USDC" }, description: `Swap ETH → USDC on ${chain} (${dex})` },
      { type: "dex_swap", chain, protocol: dex, params: { tokenIn: "USDC", tokenOut: "ETH" }, description: `Swap USDC → ETH on ${chain} (${dex})` },
    );
  }

  if (doAave) {
    tasks.push(
      { type: "aave_supply", chain, protocol: "aave-v3", params: {}, description: `Supply ETH to Aave V3 on ${chain}` },
      { type: "aave_withdraw", chain, protocol: "aave-v3", params: {}, description: `Withdraw from Aave V3 on ${chain}` },
    );
  }

  if (doWrapUnwrap) {
    tasks.push({ type: "unwrap_eth", chain, params: {}, description: `Unwrap WETH → ETH on ${chain}` });
  }

  if (doDeploy) {
    tasks.push({ type: "deploy_contract", chain, params: {}, description: `Deploy contract on ${chain}` });
  }

  if (doOrbiterBridge) {
    // Pick a random destination chain different from current
    const otherChains = L2_CHAINS.filter((c) => c !== chain);
    const toChain = otherChains[Math.floor(Math.random() * otherChains.length)];
    tasks.push({ type: "bridge_orbiter", chain, protocol: "orbiter", params: { toChain }, description: `Orbiter bridge ${chain} → ${toChain}` });
  }

  if (doZoraMint) {
    tasks.push({ type: "create_nft_collection", chain, protocol: "zora", params: {}, description: `Create Zora NFT collection on ${chain}` });
  }

  // Pendle PT round-trip (Arbitrum only, ~10% chance)
  if (chain === "arbitrum" && Math.random() < 0.1) {
    const market = Object.values(PENDLE_MARKETS.arbitrum ?? {})[0];
    if (market) {
      tasks.push(
        { type: "pendle_buy_pt", chain, protocol: "pendle", params: { market }, description: `Buy PT on Pendle (${chain})` },
        { type: "pendle_sell_pt", chain, protocol: "pendle", params: { market }, description: `Sell PT on Pendle (${chain})` },
      );
    }
  }

  // Ensure at least 2 tasks
  if (tasks.length < 2) {
    tasks.push(
      { type: "wrap_eth", chain, params: {}, description: `Wrap ETH → WETH on ${chain}` },
      { type: "unwrap_eth", chain, params: {}, description: `Unwrap WETH → ETH on ${chain}` },
    );
  }

  return tasks;
}

async function main(): Promise<void> {
  // Add random startup jitter so cron doesn't hit exact intervals
  const skipJitter = process.argv.includes("--no-jitter");
  const jitterMs = skipJitter ? 0 : randInt(0, 2 * 60 * 60 * 1000);
  if (jitterMs > 0) {
    log.info(`Scheduled farm starting (jitter: ${describeDelay(jitterMs)})...`);
    await new Promise((r) => setTimeout(r, jitterMs));
  } else {
    log.info("Scheduled farm starting (no jitter)...");
  }

  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found.");
    return;
  }

  log.divider();
  log.info(`Checking balances for ${wallets.length} wallets across ${L2_CHAINS.length} L2 chains...`);

  // Find wallets with funds on L2s
  const fundedWallets: { wallet: typeof wallets[0]; chain: string; balance: bigint }[] = [];

  for (const wallet of wallets) {
    for (const chain of L2_CHAINS) {
      try {
        const provider = getProvider(chain);
        const balance = await provider.getBalance(wallet.address);
        if (balance >= MIN_BALANCE) {
          fundedWallets.push({ wallet, chain, balance });
          log.info(`  W${String(wallet.index).padStart(2, "0")} on ${chain}: ${formatEth(balance)} ETH`);
        }
      } catch {
        // RPC error — skip
      }
    }
  }

  if (fundedWallets.length === 0) {
    log.warn("No wallets with sufficient L2 balance. Nothing to farm.");
    return;
  }

  // Shuffle and pick 1-3 wallet+chain combos to farm this round
  const selected = pickRandom(fundedWallets, Math.min(randInt(1, 3), fundedWallets.length));

  log.divider();
  log.info(`Selected ${selected.length} farming target(s) for this round:`);
  for (const s of selected) {
    log.info(`  W${String(s.wallet.index).padStart(2, "0")} → ${s.chain} (${formatEth(s.balance)} ETH)`);
  }
  log.divider();

  let totalTasks = 0;
  let totalSuccess = 0;

  for (let idx = 0; idx < selected.length; idx++) {
    const { wallet, chain } = selected[idx];
    const personality = generatePersonality(wallet.index);

    // Check active hours
    if (!shouldBeActive(personality)) {
      log.info(`W${String(wallet.index).padStart(2, "0")} sleeping (outside active hours). Skipping.`);
      continue;
    }

    const privateKey = getPrivateKey(wallet);
    const tasks = pickTasks(chain);

    // Apply amount jitter to each task
    for (const task of tasks) {
      task.params.amountWei = jitterAmount(TASK_AMOUNT, personality.amountJitter);
    }

    log.wallet(wallet.index, wallet.label, `farming ${chain} (${tasks.length} tasks)`);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      log.info(`Task ${i + 1}/${tasks.length}: ${task.description}`);

      const result = await safeExecuteTask(privateKey, task);
      totalTasks++;

      if (result.success) {
        totalSuccess++;
        log.success(`Task ${i + 1}/${tasks.length} completed ${result.txHash ? `(${result.txHash.slice(0, 14)}...)` : ""}`);
      } else {
        log.error(`Task ${i + 1}/${tasks.length} failed: ${result.error}`);
      }

      // Delay between tasks
      if (i < tasks.length - 1) {
        const delay = getDelay(personality, 30_000, 180_000);
        log.info(`Waiting ${describeDelay(delay)} before next task...`);
        await randomSleep(delay, delay);
      }
    }

    // Delay between wallet+chain combos (skip after last one)
    if (idx < selected.length - 1) {
      const walletDelay = getDelay(personality, 2 * 60_000, 10 * 60_000);
      log.info(`Waiting ${describeDelay(walletDelay)} before next target...`);
      await randomSleep(walletDelay, walletDelay);
    }
  }

  // Occasional EigenLayer deposit (Ethereum mainnet, ~5% of runs)
  if (Math.random() < 0.05) {
    const eigenWallet = wallets[0];
    if (eigenWallet) {
      try {
        const l1Provider = getProvider("ethereum");
        const l1Balance = await l1Provider.getBalance(eigenWallet.address);
        if (l1Balance > ethers.parseEther("0.01")) {
          const eigenKey = getPrivateKey(eigenWallet);
          const eigenAmount = jitterAmount(ethers.parseEther("0.005"), 0.2);
          const eigenTask: Task = {
            type: "eigen_deposit",
            chain: "ethereum",
            protocol: "eigenlayer",
            params: { amountWei: eigenAmount },
            description: "Deposit into EigenLayer (Ethereum mainnet)",
          };
          log.info(`EigenLayer: attempting deposit with W${String(eigenWallet.index).padStart(2, "0")} (${formatEth(l1Balance)} ETH on L1)`);
          const result = await safeExecuteTask(eigenKey, eigenTask);
          totalTasks++;
          if (result.success) {
            totalSuccess++;
            log.success(`EigenLayer deposit completed ${result.txHash ? `(${result.txHash.slice(0, 14)}...)` : ""}`);
          } else {
            log.error(`EigenLayer deposit failed: ${result.error}`);
          }
        }
      } catch {
        // L1 RPC error — skip
      }
    }
  }

  log.divider();
  log.success(`Scheduled farm complete: ${totalSuccess}/${totalTasks} tasks succeeded`);

  // Send Telegram summary
  const chains = [...new Set(selected.map((s) => s.chain))];
  await sendSessionSummary(totalTasks, totalSuccess, chains, 0).catch(() => {});
}

main().catch((err) => {
  log.error(`Scheduled farm crashed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
