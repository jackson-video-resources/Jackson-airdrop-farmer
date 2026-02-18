import "dotenv/config";
import { logTaskCost } from "./cost-logger.js";
import { log } from "./utils/logger.js";

// Transactions from today's Base warmup sequence
const completedTasks = [
  {
    chain: "ethereum",
    txHash: "0x319384424a4fb26a64cb59eb7ca1c751bb8ed8fd6b201693014d15b6563c9950",
    type: "bridge",
    description: "Bridge ETH → Base via OptimismPortal",
  },
  {
    chain: "base",
    txHash: "0x54bda32970d5d19c97ac46c3424603d9924614f08caa53d40175ab8e5d6c8732",
    type: "gas",
    description: "Wrap ETH → WETH on Base",
  },
  {
    chain: "base",
    txHash: "0xb834d20886bc0d4b706f93b90138f3c100b37956b33dbc0e24934d4f80b13a44",
    type: "gas",
    description: "Unwrap WETH → ETH on Base",
  },
  {
    chain: "base",
    txHash: "0x241a9656f1087ff62995db65df7ce3cc2ca0bf375317293f0d9bcc143939bb62",
    type: "deploy",
    description: "Deploy minimal contract on Base",
  },
  // Also the first bridge attempt that went to a wrong address (lost ~$6)
  {
    chain: "ethereum",
    txHash: "0x4348a7ce8fb7b442b5ee123fc8dd87f06b48ce8928e1d8c97eea27da3522bba9",
    type: "bridge",
    description: "Bridge attempt (wrong address — ETH lost)",
  },
];

async function main() {
  log.info(`Backfilling ${completedTasks.length} cost entries to dashboard...`);

  for (const task of completedTasks) {
    await logTaskCost(
      task.chain,
      task.txHash,
      task.type,
      "wallet-0",
      task.description
    );
  }

  log.success("Backfill complete!");
}

main().catch(console.error);
