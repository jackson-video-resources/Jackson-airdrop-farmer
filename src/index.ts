import "dotenv/config";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import {
  generateFleet,
  saveFleet,
  loadWallets,
  getPrivateKey,
  printBalances,
} from "./wallet-manager.js";
import { CHAIN_NAMES } from "./chains/index.js";
import { listSequences } from "./tasks/sequences.js";
import { runFleetFarming, executeTask } from "./tasks/executor.js";
import { getActivityLog, getActivitySummary } from "./activity-log.js";
import { log } from "./utils/logger.js";
import { ethers } from "ethers";
import type { Task, TaskType } from "./tasks/types.js";

const TASK_TYPES: TaskType[] = [
  "wrap_eth",
  "unwrap_eth",
  "dex_swap",
  "bridge_to_l2",
  "deploy_contract",
];

async function generateWalletFleet(): Promise<void> {
  const { count } = await inquirer.prompt([
    {
      type: "number",
      name: "count",
      message: "How many wallets?",
      default: 10,
    },
  ]);

  const spinner = ora("Generating wallet fleet...").start();
  const { mnemonic, wallets } = generateFleet(count);
  saveFleet(mnemonic, wallets);
  spinner.succeed(`Generated ${wallets.length} wallets`);

  console.log();
  console.log(chalk.red.bold("WARNING: Back up this mnemonic phrase! It cannot be recovered."));
  console.log(chalk.yellow.bold(mnemonic));
  console.log();

  log.divider();
  for (const w of wallets) {
    console.log(
      `  ${chalk.blue(`W${String(w.index).padStart(2, "0")}`)}  ${chalk.white(w.address)}`
    );
  }
  log.divider();
}

async function viewWallets(): Promise<void> {
  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first (option 1).");
    return;
  }

  const spinner = ora("Fetching balances...").start();
  spinner.stop();
  await printBalances();
}

async function runFarmingSequence(): Promise<void> {
  const sequences = listSequences();
  if (sequences.length === 0) {
    log.warn("No sequences available.");
    return;
  }

  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first.");
    return;
  }

  const { sequenceName } = await inquirer.prompt([
    {
      type: "list",
      name: "sequenceName",
      message: "Select farming sequence:",
      choices: sequences.map((s) => ({ name: `${s.name} - ${s.description}`, value: s.name })),
    },
  ]);

  const { walletChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "walletChoice",
      message: "Which wallets?",
      choices: [
        { name: `All wallets (${wallets.length})`, value: "all" },
        { name: "Specific indices", value: "specific" },
      ],
    },
  ]);

  let walletIndices: number[] | undefined;
  if (walletChoice === "specific") {
    const { indices } = await inquirer.prompt([
      {
        type: "input",
        name: "indices",
        message: "Enter wallet indices (comma-separated, e.g. 0,1,2):",
      },
    ]);
    walletIndices = indices.split(",").map((s: string) => parseInt(s.trim(), 10));
  }

  const { amountEth } = await inquirer.prompt([
    {
      type: "input",
      name: "amountEth",
      message: "ETH amount per task:",
      default: "0.001",
    },
  ]);

  const walletCount = walletIndices ? walletIndices.length : wallets.length;
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Run "${sequenceName}" on ${walletCount} wallets with ${amountEth} ETH per task?`,
      default: false,
    },
  ]);

  if (!confirm) {
    log.info("Cancelled.");
    return;
  }

  const spinner = ora("Running farming sequence...").start();
  try {
    await runFleetFarming(sequenceName, {
      walletIndices,
      amountEth: parseFloat(amountEth),
    });
    spinner.succeed("Farming sequence complete!");
  } catch (err: unknown) {
    spinner.fail("Farming sequence failed");
    log.error(err instanceof Error ? err.message : String(err));
  }
}

async function runSingleTask(): Promise<void> {
  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first.");
    return;
  }

  const { chain } = await inquirer.prompt([
    {
      type: "list",
      name: "chain",
      message: "Select chain:",
      choices: CHAIN_NAMES,
    },
  ]);

  const { taskType } = await inquirer.prompt([
    {
      type: "list",
      name: "taskType",
      message: "Select task type:",
      choices: TASK_TYPES,
    },
  ]);

  const { walletIndex } = await inquirer.prompt([
    {
      type: "list",
      name: "walletIndex",
      message: "Select wallet:",
      choices: wallets.map((w) => ({
        name: `W${String(w.index).padStart(2, "0")} - ${w.address.slice(0, 10)}...${w.address.slice(-4)}`,
        value: w.index,
      })),
    },
  ]);

  let amountEth = "0";
  if (["wrap_eth", "unwrap_eth", "dex_swap", "bridge_to_l2", "transfer_eth"].includes(taskType)) {
    const { amount } = await inquirer.prompt([
      {
        type: "input",
        name: "amount",
        message: "Amount in ETH:",
        default: "0.001",
      },
    ]);
    amountEth = amount;
  }

  const wallet = wallets.find((w) => w.index === walletIndex)!;
  const privateKey = getPrivateKey(wallet);
  const amountWei = ethers.parseEther(amountEth || "0.001");

  const task: Task = {
    type: taskType,
    chain,
    params: { amountWei, targetChain: chain },
    description: `${taskType} on ${chain}`,
  };

  const spinner = ora(`Executing ${taskType} on ${chain}...`).start();
  try {
    const result = await executeTask(privateKey, task);
    if (result.success) {
      spinner.succeed(`Task complete! TX: ${result.txHash || "n/a"}`);
    } else {
      spinner.fail(`Task failed: ${result.error}`);
    }
  } catch (err: unknown) {
    spinner.fail("Task execution error");
    log.error(err instanceof Error ? err.message : String(err));
  }
}

async function viewActivityLog(): Promise<void> {
  const summary = getActivitySummary();

  console.log();
  console.log(chalk.bold("Activity Summary"));
  log.divider();
  console.log(`  Total Transactions: ${chalk.cyan(String(summary.totalTxs))}`);
  console.log(`  Success Rate:       ${chalk.cyan((summary.successRate * 100).toFixed(1) + "%")}`);
  console.log(`  Gas Spent (wei):    ${chalk.cyan(summary.gasSpent)}`);
  console.log();

  if (Object.keys(summary.byChain).length > 0) {
    console.log(chalk.bold("  By Chain:"));
    for (const [chain, count] of Object.entries(summary.byChain)) {
      console.log(`    ${chain}: ${count}`);
    }
    console.log();
  }

  if (Object.keys(summary.byProtocol).length > 0) {
    console.log(chalk.bold("  By Protocol:"));
    for (const [protocol, count] of Object.entries(summary.byProtocol)) {
      console.log(`    ${protocol}: ${count}`);
    }
    console.log();
  }

  const entries = getActivityLog();
  const recent = entries.slice(-20).reverse();
  if (recent.length > 0) {
    console.log(chalk.bold("  Recent Transactions (last 20):"));
    log.divider();
    for (const entry of recent) {
      const status = entry.success ? chalk.green("OK") : chalk.red("FAIL");
      const addr = entry.walletAddress.slice(0, 8) + "...";
      const tx = entry.txHash ? chalk.gray(entry.txHash.slice(0, 14) + "...") : chalk.gray("no tx");
      const time = new Date(entry.timestamp).toISOString().slice(0, 19).replace("T", " ");
      console.log(`  ${chalk.gray(time)} ${status} ${addr} ${entry.task.type} on ${entry.task.chain} ${tx}`);
    }
    log.divider();
  } else {
    log.info("No activity logged yet.");
  }
}

async function exportAddresses(): Promise<void> {
  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first.");
    return;
  }

  console.log();
  console.log(chalk.bold("Wallet Addresses"));
  log.divider();
  for (const w of wallets) {
    console.log(`  W${String(w.index).padStart(2, "0")}  ${w.address}`);
  }
  log.divider();
  console.log();
  console.log(chalk.bold("Comma-separated (for easy copy):"));
  console.log(chalk.gray(wallets.map((w) => w.address).join(",")));
  console.log();
}

async function showSettings(): Promise<void> {
  console.log();
  console.log(chalk.bold("Settings"));
  log.divider();

  const envVars = [
    "ENCRYPTION_KEY",
    "RPC_ETHEREUM",
    "RPC_BASE",
    "RPC_SCROLL",
    "RPC_LINEA",
    "RPC_ZKSYNC",
  ];

  for (const key of envVars) {
    const val = process.env[key];
    if (val) {
      const masked = val.slice(0, 4) + "..." + val.slice(-4);
      console.log(`  ${chalk.cyan(key)}: ${masked}`);
    } else {
      console.log(`  ${chalk.cyan(key)}: ${chalk.gray("not set")}`);
    }
  }

  console.log();
  console.log(`  .env path: ${chalk.gray(process.cwd() + "/.env")}`);
  log.divider();
}

async function mainMenu(): Promise<void> {
  console.log();
  console.log(chalk.bold.green("  Airdrop Farmer"));
  console.log();

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "1. Generate Wallet Fleet", value: "generate" },
          { name: "2. View Wallets & Balances", value: "balances" },
          { name: "3. Run Farming Sequence", value: "sequence" },
          { name: "4. Run Single Task", value: "single" },
          { name: "5. View Activity Log", value: "activity" },
          { name: "6. Export Wallet Addresses", value: "export" },
          { name: "7. Settings", value: "settings" },
          { name: "8. Exit", value: "exit" },
        ],
      },
    ]);

    switch (action) {
      case "generate":
        await generateWalletFleet();
        break;
      case "balances":
        await viewWallets();
        break;
      case "sequence":
        await runFarmingSequence();
        break;
      case "single":
        await runSingleTask();
        break;
      case "activity":
        await viewActivityLog();
        break;
      case "export":
        await exportAddresses();
        break;
      case "settings":
        await showSettings();
        break;
      case "exit":
        console.log(chalk.gray("Goodbye!"));
        process.exit(0);
    }
  }
}

mainMenu().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
