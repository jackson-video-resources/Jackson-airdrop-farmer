import { ethers } from "ethers";
import { getProvider } from "./chains/index.js";
import { log } from "./utils/logger.js";

const DASHBOARD_URL = process.env.AIRDROP_CENTER_URL || "";

// The dashboard is an optional integration. When it is unconfigured, say so
// once per process rather than on every task -- gas costs are still recorded
// on each TaskResult regardless of whether they are forwarded anywhere.
let notifiedDisabled = false;

function costLoggingDisabled(): boolean {
  if (DASHBOARD_URL) return false;
  if (!notifiedDisabled) {
    notifiedDisabled = true;
    log.info(
      "Cost dashboard not configured (AIRDROP_CENTER_URL unset) — skipping cost logging"
    );
  }
  return true;
}

interface CostPayload {
  walletLabel?: string;
  chain: string;
  txHash?: string;
  type: string;
  gasEth?: string;
  gasUsd?: string;
  description?: string;
}

/** Fetch current ETH price in USD from a public API */
async function getEthPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.ethereum?.usd ?? 0;
  } catch {
    return 0;
  }
}

// Cache ETH price for 5 minutes
let cachedPrice = 0;
let priceTimestamp = 0;

async function getCachedEthPrice(): Promise<number> {
  if (Date.now() - priceTimestamp < 5 * 60 * 1000 && cachedPrice > 0) {
    return cachedPrice;
  }
  cachedPrice = await getEthPrice();
  priceTimestamp = Date.now();
  return cachedPrice;
}

export interface GasCost {
  /** Execution gas cost in wei (gasUsed x gasPrice) */
  gasCostWei: bigint;
  gasEth: string;
  gasUsd: number;
}

const ZERO_COST: GasCost = { gasCostWei: 0n, gasEth: "0", gasUsd: 0 };

/** Extract gas cost from a transaction receipt */
export async function getGasCost(
  chain: string,
  txHash: string
): Promise<GasCost> {
  try {
    const provider = getProvider(chain);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return ZERO_COST;

    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice ?? 0n;
    const gasCostWei = gasUsed * gasPrice;
    const gasEth = ethers.formatEther(gasCostWei);

    const ethPrice = await getCachedEthPrice();
    const gasUsd = ethPrice > 0 ? parseFloat(gasEth) * ethPrice : 0;

    return { gasCostWei, gasEth, gasUsd };
  } catch {
    return ZERO_COST;
  }
}

/** Log a cost entry to the dashboard */
export async function logCost(payload: CostPayload): Promise<void> {
  if (costLoggingDisabled()) return;

  try {
    const res = await fetch(`${DASHBOARD_URL}/api/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      log.info(
        `Cost logged: ${payload.type} on ${payload.chain} — ${payload.gasEth} ETH ($${payload.gasUsd})`
      );
    } else {
      const err = await res.text();
      log.warn(`Failed to log cost (${res.status}): ${err}`);
    }
  } catch (err: unknown) {
    log.warn(
      `Cost logging failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Log gas cost for a completed transaction to the dashboard.
 * Pass `cost` when the caller has already fetched the receipt, to avoid a
 * second `getTransactionReceipt` round-trip.
 */
export async function logTaskCost(
  chain: string,
  txHash: string,
  taskType: string,
  walletLabel?: string,
  description?: string,
  cost?: GasCost
): Promise<void> {
  // Bail before the receipt fetch so an unconfigured dashboard costs no RPC.
  if (costLoggingDisabled()) return;

  const { gasEth, gasUsd } = cost ?? (await getGasCost(chain, txHash));

  await logCost({
    walletLabel,
    chain,
    txHash,
    type: taskType,
    gasEth,
    gasUsd: gasUsd.toFixed(4),
    description,
  });
}
