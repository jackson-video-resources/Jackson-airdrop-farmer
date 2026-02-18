import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { executeTask } from "./tasks/executor.js";
import { log } from "./utils/logger.js";
import type { Task } from "./tasks/types.js";

const chain = process.argv[2];
if (!chain) {
  console.error("Usage: npx tsx src/test-chain.ts <chain>");
  process.exit(1);
}

const protocol = chain === "base" ? "uniswap-v3" : "syncswap";
const amount = ethers.parseEther("0.0003");

async function main() {
  const wallets = loadWallets();
  const privateKey = getPrivateKey(wallets[0]);

  const tasks: Task[] = [
    { type: "wrap_eth", chain, params: { amountWei: amount }, description: `Wrap ETH on ${chain}` },
    { type: "dex_swap", chain, protocol, params: { tokenIn: "ETH", tokenOut: "USDC", amountWei: amount }, description: `Swap ETH → USDC on ${chain}` },
    { type: "dex_swap", chain, protocol, params: { tokenIn: "USDC", tokenOut: "ETH", amountWei: amount }, description: `Swap USDC → ETH on ${chain}` },
    { type: "unwrap_eth", chain, params: { amountWei: amount }, description: `Unwrap WETH on ${chain}` },
  ];

  log.info(`Testing ${chain} (${protocol}) — ${tasks.length} tasks`);
  log.divider();

  for (const task of tasks) {
    log.info(`Running: ${task.description}`);
    const result = await executeTask(privateKey, task);
    if (result.success) {
      log.success(`OK: ${result.txHash?.slice(0, 20)}...`);
    } else {
      log.error(`FAIL: ${result.error}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  log.divider();
  log.success(`${chain} test complete!`);
}

main().catch(console.error);
