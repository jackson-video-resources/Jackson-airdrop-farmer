import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";
import { getChain } from "../chains/index.js";
import { withTimeout } from "../utils/timeout.js";

const RELAY_API = "https://api.relay.link";
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

interface RelayTxData {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface RelayStep {
  id: string;
  kind: string;
  items: { status: string; data: RelayTxData }[];
}

interface RelayQuote {
  steps: RelayStep[];
}

/**
 * Bridge ETH between any two Relay-supported chains.
 *
 * The signer must already be connected to `fromChain` — Relay hands back a
 * deposit transaction on the origin chain, and a relayer fills the equivalent
 * amount on the destination.
 */
export async function bridgeViaRelay(
  signer: ethers.Wallet,
  fromChain: string,
  toChain: string,
  amount: bigint,
  to?: string,
): Promise<string> {
  const from = fromChain.toLowerCase();
  const dest = toChain.toLowerCase();

  if (from === dest) {
    throw new Error("Source and destination chains must be different");
  }

  const originChainId = getChain(from).chainId;
  const destinationChainId = getChain(dest).chainId;

  const sender = await signer.getAddress();
  const recipient = to ?? sender;

  log.info(
    `Bridging ${formatEth(amount)} ETH ${from} → ${dest} via Relay${to ? ` (to ${to.slice(0, 10)}...)` : ""}...`,
  );

  const quoteBody = {
    user: sender,
    recipient,
    originChainId,
    destinationChainId,
    originCurrency: ETH_ADDRESS,
    destinationCurrency: ETH_ADDRESS,
    amount: amount.toString(),
    tradeType: "EXACT_INPUT",
  };

  const quoteRes = await fetch(`${RELAY_API}/quote/v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteBody),
    signal: AbortSignal.timeout(30_000),
  });

  if (!quoteRes.ok) {
    const err = await quoteRes.text();
    throw new Error(`Relay quote failed (${quoteRes.status}): ${err}`);
  }

  const quote: RelayQuote = await quoteRes.json();

  if (!quote.steps || quote.steps.length === 0) {
    throw new Error("Relay returned no steps");
  }

  let lastTxHash = "";

  for (const step of quote.steps) {
    if (step.kind !== "transaction") continue;

    for (const item of step.items) {
      const txData = item.data;
      if (!txData || txData.chainId !== originChainId) {
        log.info(`Skipping step (chainId: ${txData?.chainId ?? "unknown"})`);
        continue;
      }

      // Relay dictates the value we sign; never let a quote spend more than asked.
      const txValue = BigInt(txData.value);
      if (txValue > amount) {
        throw new Error(
          `Relay quote value ${formatEth(txValue)} ETH exceeds requested ${formatEth(amount)} ETH - refusing to sign`,
        );
      }

      log.info(
        `Sending Relay bridge tx to ${txData.to.slice(0, 12)}... value: ${formatEth(txValue)} ETH`,
      );

      const tx = await withTimeout(
        signer.sendTransaction({
          to: txData.to,
          value: txValue,
          data: txData.data,
        }),
        90_000,
        `${from} → ${dest} broadcast`,
      );

      const receipt = await withTimeout(
        tx.wait(),
        180_000,
        `${from} → ${dest} confirm`,
      );
      lastTxHash = receipt!.hash;
      log.tx(lastTxHash, `Relay bridge ETH ${from} → ${dest}`);
    }
  }

  if (!lastTxHash) {
    throw new Error(`No ${from} transactions executed from Relay quote`);
  }

  return lastTxHash;
}

/** Bridge ETH from Ethereum mainnet → Unichain via Relay */
export async function bridgeToUnichain(
  signer: ethers.Wallet,
  amount: bigint,
  to?: string,
): Promise<string> {
  return bridgeViaRelay(signer, "ethereum", "unichain", amount, to);
}
