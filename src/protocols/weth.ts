import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

const WETH_ADDRESSES: Record<string, string> = {
  ethereum: ethers.getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  base: ethers.getAddress("0x4200000000000000000000000000000000000006"),
  scroll: ethers.getAddress("0x5300000000000000000000000000000000000004"),
  linea: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
  zksync: ethers.getAddress("0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"),
};

const WETH_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 wad)",
];

function getWethAddress(chain: string): string {
  const addr = WETH_ADDRESSES[chain.toLowerCase()];
  if (!addr) throw new Error(`No WETH address for chain: ${chain}`);
  return addr;
}

export async function wrapEth(
  signer: ethers.Wallet,
  chain: string,
  amountWei: bigint
): Promise<string> {
  const addr = getWethAddress(chain);
  const weth = new ethers.Contract(addr, WETH_ABI, signer);

  log.info(`Wrapping ${formatEth(amountWei)} ETH → WETH on ${chain}`);
  const tx = await weth.deposit({ value: amountWei });
  const receipt = await tx.wait();

  log.tx(receipt.hash, `wrap ETH → WETH on ${chain}`);
  return receipt.hash;
}

export async function unwrapEth(
  signer: ethers.Wallet,
  chain: string,
  amountWei: bigint
): Promise<string> {
  const addr = getWethAddress(chain);
  const weth = new ethers.Contract(addr, WETH_ABI, signer);

  log.info(`Unwrapping ${formatEth(amountWei)} WETH → ETH on ${chain}`);
  const tx = await weth.withdraw(amountWei);
  const receipt = await tx.wait();

  log.tx(receipt.hash, `unwrap WETH → ETH on ${chain}`);
  return receipt.hash;
}

export { WETH_ADDRESSES };
