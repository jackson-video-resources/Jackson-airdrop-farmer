import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { getRouterAddresses, getTokenAddresses } from "./address-registry.js";

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export interface AllowanceEntry {
  token: string;
  tokenLabel: string;
  spender: string;
  spenderLabel: string;
  allowance: bigint;
}

/** Scan all outstanding allowances for known routers on a chain */
export async function scanAllowances(
  chain: string,
  signer: ethers.Wallet
): Promise<AllowanceEntry[]> {
  const owner = await signer.getAddress();
  const routers = getRouterAddresses(chain);
  const tokens = getTokenAddresses(chain);
  const results: AllowanceEntry[] = [];

  for (const token of tokens) {
    const erc20 = new ethers.Contract(token.address, ERC20_ABI, signer);
    for (const router of routers) {
      try {
        const allowance: bigint = await erc20.allowance(owner, router.address);
        if (allowance > 0n) {
          results.push({
            token: token.address,
            tokenLabel: token.label,
            spender: router.address,
            spenderLabel: router.label,
            allowance,
          });
        }
      } catch {
        // Skip on error (token might not exist on this chain)
      }
    }
  }

  return results;
}

/** Revoke a specific token allowance (set to 0) */
export async function revokeAllowance(
  signer: ethers.Wallet,
  tokenAddress: string,
  spenderAddress: string
): Promise<string | null> {
  try {
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const owner = await signer.getAddress();
    const current: bigint = await erc20.allowance(owner, spenderAddress);

    if (current === 0n) return null; // already zero

    log.info(`Revoking allowance: ${tokenAddress.slice(0, 10)}... → ${spenderAddress.slice(0, 10)}...`);
    const tx = await erc20.approve(spenderAddress, 0n);
    const receipt = await tx.wait();
    log.success(`Allowance revoked (${receipt.hash.slice(0, 14)}...)`);
    return receipt.hash;
  } catch (err: unknown) {
    log.warn(`Failed to revoke allowance: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/** Revoke all non-zero allowances on a chain */
export async function revokeAll(
  chain: string,
  signer: ethers.Wallet
): Promise<string[]> {
  const allowances = await scanAllowances(chain, signer);
  const txHashes: string[] = [];

  for (const entry of allowances) {
    const hash = await revokeAllowance(signer, entry.token, entry.spender);
    if (hash) txHashes.push(hash);
  }

  if (txHashes.length > 0) {
    log.success(`Revoked ${txHashes.length} allowance(s) on ${chain}`);
  }

  return txHashes;
}

/** Get the router address for a protocol+chain combo (for post-swap revocation) */
export function getSpenderForTask(
  chain: string,
  protocol?: string
): string | null {
  if (!protocol) return null;
  const routers = getRouterAddresses(chain);
  const match = routers.find((r) =>
    r.protocol === protocol || r.label.toLowerCase().includes(protocol.toLowerCase())
  );
  return match?.address ?? null;
}
