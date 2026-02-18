import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// CrocSwapDex on Scroll — single-contract DEX
const CROC_SWAP_DEX = ethers.getAddress(
  "0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106"
);

// Standard pool template index on Ambient
const POOL_IDX = 420n;

// Limit prices in Q64.64 sqrt format (max range = no partial fill restriction)
const MAX_SQRT_PRICE = 21267430153580247136652501917186561137n;
const MIN_SQRT_PRICE = 65538n;

export const SCROLL_TOKENS: Record<string, string> = {
  WETH: ethers.getAddress("0x5300000000000000000000000000000000000004"),
  USDC: ethers.getAddress("0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4"),
};

const CROC_SWAP_ABI = [
  "function userCmd(uint16 callpath, bytes cmd) payable returns (bytes)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/**
 * Swap tokens on Ambient (CrocSwap) DEX on Scroll.
 * Uses userCmd(1, ...) since the direct swap() hot path is deprecated.
 */
export async function swapAmbient(
  signer: ethers.Wallet,
  chain: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<string> {
  if (chain.toLowerCase() !== "scroll") {
    throw new Error("Ambient swap is only available on Scroll");
  }

  const dex = new ethers.Contract(CROC_SWAP_DEX, CROC_SWAP_ABI, signer);
  const recipient = await signer.getAddress();

  const wethAddr = SCROLL_TOKENS.WETH;
  const isEthIn =
    tokenIn.toLowerCase() === wethAddr.toLowerCase() ||
    tokenIn === ethers.ZeroAddress;
  const isEthOut =
    tokenOut.toLowerCase() === wethAddr.toLowerCase() ||
    tokenOut === ethers.ZeroAddress;

  // Ambient uses address(0) for native ETH
  const effectiveIn = isEthIn ? ethers.ZeroAddress : tokenIn;
  const effectiveOut = isEthOut ? ethers.ZeroAddress : tokenOut;

  // Base token must have a lower address than quote token
  const inIsBase = effectiveIn.toLowerCase() < effectiveOut.toLowerCase();
  const base = inIsBase ? effectiveIn : effectiveOut;
  const quote = inIsBase ? effectiveOut : effectiveIn;

  // isBuy=true → paying base, receiving quote
  // isBuy=false → paying quote, receiving base
  const isBuy = inIsBase;
  const inBaseQty = inIsBase;

  // Limit price: max when buying, min when selling
  const limitPrice = isBuy ? MAX_SQRT_PRICE : MIN_SQRT_PRICE;

  // Approve ERC20 if not sending native ETH
  if (!isEthIn) {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, CROC_SWAP_DEX);
    if (allowance < amountIn) {
      log.info(`Approving ${tokenIn.slice(0, 10)} for Ambient DEX`);
      const approveTx = await token.approve(CROC_SWAP_DEX, amountIn);
      await approveTx.wait();
      log.success("Approval confirmed");
    }
  }

  // Encode swap command: callpath 1 = swap
  // minOut=0 acceptable for small farming amounts (MEV sandwich not economical)
  const cmd = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "address",
      "address",
      "uint256",
      "bool",
      "bool",
      "uint128",
      "uint16",
      "uint128",
      "uint128",
      "uint8",
    ],
    [base, quote, POOL_IDX, isBuy, inBaseQty, amountIn, 0, limitPrice, 0n, 0]
  );

  log.info(
    `Ambient: swapping ${formatEth(amountIn)} ${isEthIn ? "ETH" : tokenIn.slice(0, 10)} → ${isEthOut ? "ETH" : tokenOut.slice(0, 10)} on Scroll`
  );

  const tx = await dex.userCmd(1, cmd, {
    value: isEthIn ? amountIn : 0n,
  });
  const receipt = await tx.wait();

  log.tx(receipt.hash, "Ambient swap on Scroll");
  return receipt.hash;
}
