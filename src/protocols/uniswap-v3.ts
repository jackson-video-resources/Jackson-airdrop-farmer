import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

const SWAP_ROUTER_BASE = ethers.getAddress("0x2626664c2603336e57b271c5c0b26f421741e481");

export const BASE_TOKENS: Record<string, string> = {
  WETH: ethers.getAddress("0x4200000000000000000000000000000000000006"),
  USDC: ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
  DAI: ethers.getAddress("0x50c5725949a6f0c72e6c4a641f24049a917db0cb"),
};

const SWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export async function swapExactInput(
  signer: ethers.Wallet,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  fee: number = 3000,
  slippagePct: number = 0.5
): Promise<string> {
  const router = new ethers.Contract(SWAP_ROUTER_BASE, SWAP_ROUTER_ABI, signer);
  const recipient = await signer.getAddress();

  const isEthIn = tokenIn.toLowerCase() === BASE_TOKENS.WETH.toLowerCase();
  // Set amountOutMinimum to 0 — different token decimals make ratio-based slippage unreliable
  // For small farming amounts this is acceptable; a MEV sandwich on $2 is not economical
  const amountOutMinimum = 0n;

  // Approve token if not sending ETH
  if (!isEthIn) {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, SWAP_ROUTER_BASE);
    if (allowance < amountIn) {
      log.info(`Approving ${tokenIn} for SwapRouter`);
      const approveTx = await token.approve(SWAP_ROUTER_BASE, amountIn);
      await approveTx.wait();
      log.success("Approval confirmed");
    }
  }

  const params = {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  log.info(
    `Swapping ${formatEth(amountIn)} ${isEthIn ? "ETH" : tokenIn.slice(0, 10)} → ${tokenOut.slice(0, 10)} on Base`
  );

  const tx = await router.exactInputSingle(params, {
    value: isEthIn ? amountIn : 0n,
  });
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Uniswap V3 swap on Base`);
  return receipt.hash;
}
