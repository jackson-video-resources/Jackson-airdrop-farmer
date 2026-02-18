import { ethers } from "ethers";
import { getProvider, getSigner } from "../chains/index.js";
import { log } from "../utils/logger.js";
import { isKnownAddress, registerAddress } from "./address-registry.js";
import type { Task } from "../tasks/types.js";

/** Token address lookup per chain (mirrors executor.ts) */
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  base: {
    ETH: ethers.getAddress("0x4200000000000000000000000000000000000006"),
    USDC: ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
  },
  scroll: {
    ETH: ethers.getAddress("0x5300000000000000000000000000000000000004"),
    USDC: ethers.getAddress("0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"),
  },
  linea: {
    ETH: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
    USDC: ethers.getAddress("0x176211869ca2b568f2a7d4ee941e073a821ee1ff"),
  },
  zksync: {
    ETH: ethers.getAddress("0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"),
    USDC: ethers.getAddress("0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4"),
  },
};

/** Validate all addresses a task will interact with */
export function validateTaskAddresses(task: Task): void {
  const chain = task.chain;

  switch (task.type) {
    case "dex_swap": {
      const tokenInSymbol = (task.params.tokenIn as string) ?? "ETH";
      const tokenOutSymbol = (task.params.tokenOut as string) ?? "USDC";
      const tokens = TOKEN_ADDRESSES[chain.toLowerCase()];
      if (tokens) {
        const tokenIn = tokens[tokenInSymbol.toUpperCase()];
        const tokenOut = tokens[tokenOutSymbol.toUpperCase()];
        if (tokenIn) validateKnown(chain, tokenIn, `tokenIn ${tokenInSymbol}`);
        if (tokenOut) validateKnown(chain, tokenOut, `tokenOut ${tokenOutSymbol}`);
      }
      break;
    }
    case "transfer_eth": {
      const to = task.params.to as string;
      if (to && !isKnownAddress(chain, to)) {
        log.warn(`[SAFETY] Transfer target ${to} is not in the address registry`);
        // Don't block transfers — user might intentionally send to new addresses
        // But do log a warning
      }
      break;
    }
    // wrap, unwrap, bridge, deploy all use hardcoded addresses in their adapters
    // which are already in the registry — no extra validation needed
  }
}

function validateKnown(chain: string, address: string, context: string): void {
  if (!isKnownAddress(chain, address)) {
    throw new Error(
      `SAFETY: Token ${address} (${context}) on ${chain} is not in the address registry. ` +
      `Add it before interacting.`
    );
  }
}

/** Pre-check: estimate gas to detect if a transaction would revert */
export async function preSimulate(
  chain: string,
  privateKey: string,
  task: Task
): Promise<{ shouldProceed: boolean; reason?: string }> {
  // Only simulate for task types that have had revert issues
  if (!["dex_swap", "bridge_to_l2"].includes(task.type)) {
    return { shouldProceed: true };
  }

  // For swaps, we can't easily simulate without building the exact tx
  // The protocol adapters will catch reverts and return errors
  // For now, this is a placeholder for future deeper simulation
  return { shouldProceed: true };
}
