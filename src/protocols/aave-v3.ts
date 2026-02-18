import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// Aave V3 Pool addresses per chain
const POOL_ADDRESSES: Record<string, string> = {
  base: ethers.getAddress("0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"),
  scroll: ethers.getAddress("0x11fCfe756c05AD438e312a7fd934381537D3cFfe"),
  linea: ethers.getAddress("0xc47b8c00b0f69a36fa203ffeac0334874574a8ac"),
  arbitrum: ethers.getAddress("0x794a61358D6845594F94dc1DB02A252b5b4814aD"),
  optimism: ethers.getAddress("0x794a61358D6845594F94dc1DB02A252b5b4814aD"),
};

// WETH addresses per chain (must match what Aave expects as the underlying asset)
const WETH_ADDRESSES: Record<string, string> = {
  base: ethers.getAddress("0x4200000000000000000000000000000000000006"),
  scroll: ethers.getAddress("0x5300000000000000000000000000000000000004"),
  linea: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
  arbitrum: ethers.getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  optimism: ethers.getAddress("0x4200000000000000000000000000000000000006"),
};

const POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "function withdraw(address asset, uint256 amount, address to) returns (uint256)",
];

const WETH_ABI = [
  "function deposit() payable",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

function getPoolAddress(chain: string): string {
  const addr = POOL_ADDRESSES[chain.toLowerCase()];
  if (!addr) throw new Error(`Aave V3 not available on chain: ${chain}`);
  return addr;
}

function getWethAddress(chain: string): string {
  const addr = WETH_ADDRESSES[chain.toLowerCase()];
  if (!addr) throw new Error(`No WETH address for chain: ${chain}`);
  return addr;
}

/**
 * Supply ETH to Aave V3 — wraps ETH to WETH, approves the Pool, then calls supply.
 */
export async function supplyETH(
  signer: ethers.Wallet,
  chain: string,
  amountWei: bigint
): Promise<string> {
  const poolAddr = getPoolAddress(chain);
  const wethAddr = getWethAddress(chain);
  const recipient = await signer.getAddress();

  const weth = new ethers.Contract(wethAddr, WETH_ABI, signer);
  const pool = new ethers.Contract(poolAddr, POOL_ABI, signer);

  // 1. Wrap ETH → WETH
  log.info(`Wrapping ${formatEth(amountWei)} ETH → WETH for Aave V3 on ${chain}`);
  const wrapTx = await weth.deposit({ value: amountWei });
  await wrapTx.wait();

  // 2. Approve Pool to spend WETH
  const allowance: bigint = await weth.allowance(recipient, poolAddr);
  if (allowance < amountWei) {
    log.info(`Approving Aave V3 Pool to spend WETH on ${chain}`);
    const approveTx = await weth.approve(poolAddr, amountWei);
    await approveTx.wait();
  }

  // 3. Supply WETH to Pool
  log.info(`Supplying ${formatEth(amountWei)} WETH to Aave V3 on ${chain}`);
  const tx = await pool.supply(wethAddr, amountWei, recipient, 0);
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Aave V3 supply on ${chain}`);
  return receipt.hash;
}

/**
 * Withdraw ETH from Aave V3 — calls pool.withdraw for WETH.
 * Note: this returns WETH, not native ETH. Caller can unwrap separately if needed.
 */
export async function withdrawETH(
  signer: ethers.Wallet,
  chain: string,
  amountWei: bigint
): Promise<string> {
  const poolAddr = getPoolAddress(chain);
  const wethAddr = getWethAddress(chain);
  const recipient = await signer.getAddress();

  const pool = new ethers.Contract(poolAddr, POOL_ABI, signer);

  log.info(`Withdrawing ${formatEth(amountWei)} WETH from Aave V3 on ${chain}`);
  const tx = await pool.withdraw(wethAddr, amountWei, recipient);
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Aave V3 withdraw on ${chain}`);
  return receipt.hash;
}
