import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// Orbiter Finance Bridge 2 router — same address on all EVM chains
const ORBITER_ROUTER = ethers.getAddress(
  "0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"
);

// Orbiter identification codes: appended as the last 4 digits of the transfer amount
// to tell the maker which destination chain to send funds to
const CHAIN_ID_CODES: Record<string, bigint> = {
  ethereum: 9001n,
  arbitrum: 9002n,
  optimism: 9007n,
  zksync: 9014n,
  scroll: 9019n,
  base: 9021n,
  linea: 9023n,
};

/**
 * Encode the destination chain into the transfer amount.
 * Replaces the last 4 digits of the wei amount with the chain identification code.
 */
function encodeAmount(amountWei: bigint, destCode: bigint): bigint {
  const trimmed = (amountWei / 10000n) * 10000n;
  return trimmed + destCode;
}

/**
 * Bridge ETH via Orbiter Finance (cross-L2 maker model).
 *
 * Sends ETH to the Orbiter router on the source chain with the destination
 * chain encoded in the last 4 digits of the amount. The Orbiter maker detects
 * this and sends equivalent ETH on the destination chain.
 */
export async function bridgeOrbiter(
  signer: ethers.Wallet,
  fromChain: string,
  toChain: string,
  amountWei: bigint
): Promise<string> {
  const from = fromChain.toLowerCase();
  const to = toChain.toLowerCase();

  if (from === to) {
    throw new Error("Source and destination chains must be different");
  }

  const destCode = CHAIN_ID_CODES[to];
  if (!destCode) {
    throw new Error(
      `Unsupported Orbiter destination: ${toChain}. Available: ${Object.keys(CHAIN_ID_CODES).join(", ")}`
    );
  }

  if (!CHAIN_ID_CODES[from]) {
    throw new Error(
      `Unsupported Orbiter source: ${fromChain}. Available: ${Object.keys(CHAIN_ID_CODES).join(", ")}`
    );
  }

  const encodedAmount = encodeAmount(amountWei, destCode);

  log.info(
    `Orbiter bridge: ${formatEth(amountWei)} ETH ${fromChain} → ${toChain} (encoded: ${encodedAmount})`
  );

  const tx = await signer.sendTransaction({
    to: ORBITER_ROUTER,
    value: encodedAmount,
  });
  const receipt = await tx.wait();

  log.tx(receipt!.hash, `Orbiter bridge ${fromChain} → ${toChain}`);
  return receipt!.hash;
}
