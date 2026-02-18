import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { executeTask } from "./tasks/executor.js";
import { log } from "./utils/logger.js";
import { randomSleep, describeDelay } from "./utils/random.js";
import type { Task } from "./tasks/types.js";

async function main() {
  const wallets = loadWallets();
  const w0 = wallets[0];
  const privateKey = getPrivateKey(w0);

  // Base tasks (skip bridge since funds are already on Base)
  const amount = ethers.parseEther("0.001");
  const tasks: Task[] = [
    { type: "wrap_eth", chain: "base", params: { amountWei: amount }, description: "Wrap ETH → WETH on Base" },
    {
      type: "dex_swap", chain: "base", protocol: "uniswap-v3",
      params: { tokenIn: "ETH", tokenOut: "USDC", amountWei: amount },
      description: "Swap ETH → USDC on Base (Uniswap V3)",
    },
    {
      type: "dex_swap", chain: "base", protocol: "uniswap-v3",
      params: { tokenIn: "USDC", tokenOut: "ETH" },
      description: "Swap USDC → ETH on Base (Uniswap V3)",
    },
    { type: "unwrap_eth", chain: "base", params: { amountWei: amount }, description: "Unwrap WETH → ETH on Base" },
    { type: "deploy_contract", chain: "base", params: {}, description: "Deploy contract on Base" },
  ];

  log.info(`Running ${tasks.length} Base tasks for W00 (${w0.address})`);
  log.divider();

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    log.info(`Task ${i + 1}/${tasks.length}: ${task.description}`);

    const result = await executeTask(privateKey, task);

    if (result.success) {
      log.success(`Task ${i + 1}/${tasks.length} completed (${result.txHash?.slice(0, 14)}...)`);
    } else {
      log.error(`Task ${i + 1}/${tasks.length} failed: ${result.error}`);
    }

    // Random delay between tasks (30s - 3min)
    if (i < tasks.length - 1) {
      const delay = 30_000 + Math.random() * 150_000;
      log.info(`Waiting ${describeDelay(delay)} before next task...`);
      await randomSleep(delay, delay);
    }
  }

  log.divider();
  log.success("Base warmup sequence complete!");
}

main().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
