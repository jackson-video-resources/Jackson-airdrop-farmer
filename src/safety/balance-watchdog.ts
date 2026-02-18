import { ethers } from "ethers";
import { getProvider } from "../chains/index.js";
import { formatEth } from "../utils/gas.js";
import { sendAlert } from "./alerts.js";

/** Expected maximum gas cost per task type (generous margins) */
const GAS_BUDGETS: Record<string, bigint> = {
  wrap_eth: ethers.parseEther("0.001"),
  unwrap_eth: ethers.parseEther("0.001"),
  dex_swap: ethers.parseEther("0.002"),
  deploy_contract: ethers.parseEther("0.002"),
  bridge_to_l2: ethers.parseEther("0.005"),
  bridge_orbiter: ethers.parseEther("0.002"),
  bridge_stargate: ethers.parseEther("0.005"),
  transfer_eth: ethers.parseEther("0.001"),
  aave_supply: ethers.parseEther("0.003"),     // wrap + approve + supply
  aave_withdraw: ethers.parseEther("0.002"),
  create_nft_collection: ethers.parseEther("0.003"),
  mint_nft: ethers.parseEther("0.002"),
  eigen_deposit: ethers.parseEther("0.01"),    // L1 gas is expensive
  eigen_withdraw: ethers.parseEther("0.01"),
  pendle_buy_pt: ethers.parseEther("0.005"),
  pendle_sell_pt: ethers.parseEther("0.005"),
};

export interface BalanceSnapshot {
  chain: string;
  address: string;
  balance: bigint;
  timestamp: number;
}

/** Take a balance snapshot */
export async function snapshotBalance(
  chain: string,
  address: string
): Promise<BalanceSnapshot> {
  const provider = getProvider(chain);
  const balance = await provider.getBalance(address);
  return { chain, address, balance, timestamp: Date.now() };
}

/** Check balance after task execution and alert if suspicious */
export async function checkBalanceDrop(
  snapshot: BalanceSnapshot,
  taskType: string,
  taskAmount: bigint = 0n  // amount sent in the tx (bridge amount, transfer amount, etc.)
): Promise<{ ok: boolean; dropped: bigint; alert?: string }> {
  const provider = getProvider(snapshot.chain);
  const currentBalance = await provider.getBalance(snapshot.address);

  // Balance can go UP (e.g., unwrap returns ETH, swap returns ETH)
  if (currentBalance >= snapshot.balance) {
    return { ok: true, dropped: 0n };
  }

  const dropped = snapshot.balance - currentBalance;

  // Expected cost = gas budget + any amount sent away (bridge, transfer)
  const gasBudget = GAS_BUDGETS[taskType] ?? ethers.parseEther("0.005");
  const expectedMax = gasBudget + taskAmount;

  // Allow 2x margin for gas price spikes
  const threshold = expectedMax * 2n;

  if (dropped > threshold) {
    const msg = [
      `Unexpected balance drop on ${snapshot.chain}!`,
      `Wallet: ${snapshot.address.slice(0, 10)}...`,
      `Task: ${taskType}`,
      `Expected max: ${formatEth(expectedMax)} ETH`,
      `Actual drop: ${formatEth(dropped)} ETH`,
      `Before: ${formatEth(snapshot.balance)} ETH`,
      `After: ${formatEth(currentBalance)} ETH`,
    ].join("\n");

    await sendAlert(msg, "critical");
    return { ok: false, dropped, alert: msg };
  }

  return { ok: true, dropped };
}

/** Get the amount of ETH that will leave the wallet for a given task type */
export function getTaskSendAmount(
  taskType: string,
  amountWei: bigint
): bigint {
  switch (taskType) {
    case "bridge_to_l2":
    case "bridge_orbiter":
    case "bridge_stargate":
    case "transfer_eth":
      return amountWei; // these send ETH away
    case "wrap_eth":
    case "aave_supply":
    case "eigen_deposit":
    case "pendle_buy_pt":
      return amountWei; // ETH leaves as wrapped/staked form
    case "dex_swap":
      return amountWei; // ETH leaves as token (comes back on reverse swap)
    case "create_nft_collection":
    case "mint_nft":
      return amountWei; // mint cost
    case "unwrap_eth":
    case "aave_withdraw":
    case "eigen_withdraw":
    case "pendle_sell_pt":
    case "deploy_contract":
      return 0n; // only gas (or receives ETH back)
    default:
      return amountWei;
  }
}
