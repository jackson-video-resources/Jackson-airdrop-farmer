import { ethers } from "ethers";
import { getProvider } from "./chains/index.js";
import { log } from "./utils/logger.js";

const DASHBOARD_URL = process.env.AIRDROP_CENTER_URL || "";

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

/** Extract gas cost from a transaction receipt */
export async function getGasCost(
  chain: string,
  txHash: string
): Promise<{ gasEth: string; gasUsd: string }> {
  try {
    const provider = getProvider(chain);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return { gasEth: "0", gasUsd: "0" };

    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice ?? 0n;
    const gasCostWei = gasUsed * gasPrice;
    const gasEth = ethers.formatEther(gasCostWei);

    const ethPrice = await getCachedEthPrice();
    const gasUsd = ethPrice > 0
      ? (parseFloat(gasEth) * ethPrice).toFixed(4)
      : "0";

    return { gasEth, gasUsd };
  } catch {
    return { gasEth: "0", gasUsd: "0" };
  }
}

/** Log a cost entry to the dashboard */
export async function logCost(payload: CostPayload): Promise<void> {
  if (!DASHBOARD_URL) {
    log.warn("No AIRDROP_CENTER_URL set — skipping cost logging");
    return;
  }

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

/** Log gas cost for a completed transaction to the dashboard */
export async function logTaskCost(
  chain: string,
  txHash: string,
  taskType: string,
  walletLabel?: string,
  description?: string
): Promise<void> {
  const { gasEth, gasUsd } = await getGasCost(chain, txHash);

  await logCost({
    walletLabel,
    chain,
    txHash,
    type: taskType,
    gasEth,
    gasUsd,
    description,
  });
}
