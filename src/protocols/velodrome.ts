import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// Velodrome V2 Router on Optimism
const VELODROME_ROUTER = ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858");
// Aerodrome Router on Base
const AERODROME_ROUTER = ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43");

const FACTORY_ADDRESSES: Record<string, string> = {
  optimism: ethers.getAddress("0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a"),
  base: ethers.getAddress("0x420DD381b31aEf6683db6B902084cB0FFECe40Da"),
};

const WETH_ADDRESSES: Record<string, string> = {
  optimism: ethers.getAddress("0x4200000000000000000000000000000000000006"),
  base: ethers.getAddress("0x4200000000000000000000000000000000000006"),
};

export const USDC_ADDRESSES: Record<string, string> = {
  optimism: ethers.getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  base: ethers.getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
};

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, address to, uint256 deadline) payable returns (uint256[])",
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, address to, uint256 deadline) returns (uint256[])",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

function getRouterAddress(chain: string): string {
  const key = chain.toLowerCase();
  if (key === "optimism") return VELODROME_ROUTER;
  if (key === "base") return AERODROME_ROUTER;
  throw new Error(`Velodrome/Aerodrome not available on chain: ${chain}`);
}

function getDexName(chain: string): string {
  return chain.toLowerCase() === "optimism" ? "Velodrome" : "Aerodrome";
}

export async function swapVelodrome(
  signer: ethers.Wallet,
  chain: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
): Promise<string> {
  const key = chain.toLowerCase();
  const routerAddr = getRouterAddress(chain);
  const router = new ethers.Contract(routerAddr, ROUTER_ABI, signer);
  const recipient = await signer.getAddress();
  const dexName = getDexName(chain);

  const wethAddr = WETH_ADDRESSES[key];
  const factory = FACTORY_ADDRESSES[key];
  if (!factory) throw new Error(`No factory configured for chain: ${chain}`);

  const isEthIn = wethAddr && tokenIn.toLowerCase() === wethAddr.toLowerCase();
  const isEthOut = wethAddr && tokenOut.toLowerCase() === wethAddr.toLowerCase();

  // Build route: use WETH address in the route for native ETH
  const routeFrom = isEthIn ? wethAddr : tokenIn;
  const routeTo = isEthOut ? wethAddr : tokenOut;

  const routes = [
    {
      from: routeFrom,
      to: routeTo,
      stable: false,
      factory,
    },
  ];

  const block = await signer.provider!.getBlock("latest");
  const deadline = BigInt(block!.timestamp) + 1800n;

  // amountOutMin set to 0 — for small farming amounts, MEV sandwich is not economical
  const amountOutMin = 0n;

  if (isEthIn) {
    log.info(
      `${dexName}: swapping ${formatEth(amountIn)} ETH → ${tokenOut.slice(0, 10)} on ${chain}`
    );

    const tx = await router.swapExactETHForTokens(
      amountOutMin,
      routes,
      recipient,
      deadline,
      { value: amountIn },
    );
    const receipt = await tx.wait();
    log.tx(receipt.hash, `${dexName} swap on ${chain}`);
    return receipt.hash;
  } else {
    // Approve token for router
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, routerAddr);
    if (allowance < amountIn) {
      log.info(`Approving ${tokenIn.slice(0, 10)} for ${dexName} router on ${chain}`);
      const approveTx = await token.approve(routerAddr, amountIn);
      await approveTx.wait();
      log.success("Approval confirmed");
    }

    log.info(
      `${dexName}: swapping ${tokenIn.slice(0, 10)} → ${formatEth(amountIn)} ETH on ${chain}`
    );

    const tx = await router.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      routes,
      recipient,
      deadline,
    );
    const receipt = await tx.wait();
    log.tx(receipt.hash, `${dexName} swap on ${chain}`);
    return receipt.hash;
  }
}
