import { ethers } from "ethers";

/** Get current gas price with a multiplier for faster confirmation */
export async function getGasPrice(
  provider: ethers.JsonRpcProvider,
  multiplier: number = 1.1
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const base = feeData.gasPrice ?? ethers.parseUnits("1", "gwei");
  return BigInt(Math.floor(Number(base) * multiplier));
}

/** Estimate gas with a safety buffer */
export async function estimateGasWithBuffer(
  provider: ethers.JsonRpcProvider,
  tx: ethers.TransactionRequest,
  bufferPct: number = 0.2
): Promise<bigint> {
  const estimate = await provider.estimateGas(tx);
  return BigInt(Math.floor(Number(estimate) * (1 + bufferPct)));
}

/** Format ETH value for display */
export function formatEth(wei: bigint, decimals: number = 6): string {
  return Number(ethers.formatEther(wei)).toFixed(decimals);
}

/** Format USD value */
export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
