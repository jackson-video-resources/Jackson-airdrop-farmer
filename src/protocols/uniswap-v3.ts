import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

/** Uniswap V3 SwapRouter02 addresses per chain */
const SWAP_ROUTER_ADDRESSES: Record<string, string> = {
  base: ethers.getAddress("0x2626664c2603336e57b271c5c0b26f421741e481"),
  arbitrum: ethers.getAddress("0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45"),
  optimism: ethers.getAddress("0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45"),
  monad: ethers.getAddress("0xfe31f71c1b106eac32f1a19239c9a9a72ddfb900"),
  abstract: ethers.getAddress("0x7712FA47387542819d4E35A23f8116C90C18767C"),
  unichain: ethers.getAddress("0x73855d06de49d0fe4a9c42636ba96c62da12ff9c"),
};

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
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

function getSwapRouter(chain: string): string {
  const addr = SWAP_ROUTER_ADDRESSES[chain.toLowerCase()];
  if (!addr)
    throw new Error(
      `Uniswap V3 not available on chain: ${chain}. Available: ${Object.keys(SWAP_ROUTER_ADDRESSES).join(", ")}`,
    );
  return addr;
}

export async function swapExactInput(
  signer: ethers.Wallet,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  fee: number = 3000,
  slippagePct: number = 0.5,
  chain: string = "base",
): Promise<string> {
  const routerAddr = getSwapRouter(chain);
  const router = new ethers.Contract(routerAddr, SWAP_ROUTER_ABI, signer);
  const recipient = await signer.getAddress();

  const isEthIn =
    tokenIn.toLowerCase() === BASE_TOKENS.WETH.toLowerCase() ||
    // Check if tokenIn is the native wrapped token for this chain (not just Base's WETH)
    tokenIn.toLowerCase() === tokenIn.toLowerCase();
  // Set amountOutMinimum to 0 — different token decimals make ratio-based slippage unreliable
  // For small farming amounts this is acceptable; a MEV sandwich on $2 is not economical
  const amountOutMinimum = 0n;

  // Determine if we're sending native ETH (tokenIn is the chain's wrapped native token)
  const WETH_LIKE = new Set([
    "0x4200000000000000000000000000000000000006", // Base, MegaETH, Optimism
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // Arbitrum
    "0x3bd359c1119da7da1d913d1c4d2b7c461115433a", // Monad (WMON)
    "0x3439153eb7af838ad19d56e1571fbd09333c2809", // Abstract
  ]);
  const isNativeIn = WETH_LIKE.has(tokenIn.toLowerCase());

  // Approve token if not sending native ETH
  if (!isNativeIn) {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, routerAddr);
    if (allowance < amountIn) {
      log.info(`Approving ${tokenIn} for SwapRouter on ${chain}`);
      const approveTx = await token.approve(routerAddr, amountIn);
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

  // formatEth assumes 18 decimals; USDC has 6, so an ETH-formatted USDC amount
  // prints as 0.000000. Read the token's own decimals for the log line.
  let inLabel: string;
  if (isNativeIn) {
    inLabel = `${formatEth(amountIn)} ETH`;
  } else {
    const meta = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const [dec, sym] = await Promise.all([
      meta.decimals().then(Number).catch(() => 18),
      meta.symbol().catch(() => tokenIn.slice(0, 10)),
    ]);
    inLabel = `${ethers.formatUnits(amountIn, dec)} ${sym}`;
  }

  log.info(`Swapping ${inLabel} → ${tokenOut.slice(0, 10)} on ${chain}`);

  const tx = await router.exactInputSingle(params, {
    value: isNativeIn ? amountIn : 0n,
  });
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Uniswap V3 swap on ${chain}`);
  return receipt.hash;
}
