import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner } from "./chains/index.js";
import { executeTask } from "./tasks/executor.js";
import { log } from "./utils/logger.js";
import type { Task } from "./tasks/types.js";

async function main() {
  const wallets = loadWallets();
  const w0 = wallets[0];
  const privateKey = getPrivateKey(w0);

  const amount = ethers.parseEther("0.0005");

  const tasks: Task[] = [
    {
      type: "dex_swap",
      chain: "base",
      protocol: "uniswap-v3",
      params: { tokenIn: "ETH", tokenOut: "USDC", amountWei: amount },
      description: "Swap ETH → USDC on Base",
    },
    {
      type: "dex_swap",
      chain: "base",
      protocol: "uniswap-v3",
      params: { tokenIn: "USDC", tokenOut: "ETH", amountWei: amount },
      description: "Swap USDC → ETH on Base",
    },
  ];

  for (const task of tasks) {
    log.info(`Running: ${task.description}`);
    const result = await executeTask(privateKey, task);
    if (result.success) {
      log.success(`OK: ${result.txHash}`);
    } else {
      log.error(`FAIL: ${result.error}`);
    }
    // Short delay
    await new Promise((r) => setTimeout(r, 5000));
  }

  log.success("Swap test complete!");
}

main().catch(console.error);
