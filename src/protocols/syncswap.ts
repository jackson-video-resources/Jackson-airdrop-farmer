import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";
import { getProvider } from "../chains/index.js";

const ROUTER_ADDRESSES: Record<string, string> = {
  zksync: ethers.getAddress("0x2da10a1e27bf85cedd8ffb1abbe97e53391c0295"),
  scroll: ethers.getAddress("0x80e38291e06339d10aab483c65695d004dbd5c69"),
  linea: ethers.getAddress("0x80e38291e06339d10aab483c65695d004dbd5c69"),
};

const POOL_FACTORY_ADDRESSES: Record<string, string> = {
  zksync: ethers.getAddress("0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb"),
  scroll: ethers.getAddress("0x37bac764494c8db4e54bde72f6965bea9fa0ac2d"),
  linea: ethers.getAddress("0x37bac764494c8db4e54bde72f6965bea9fa0ac2d"),
};

const WETH_ADDRESSES: Record<string, string> = {
  zksync: ethers.getAddress("0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"),
  scroll: ethers.getAddress("0x5300000000000000000000000000000000000004"),
  linea: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
};

export const USDC_ADDRESSES: Record<string, string> = {
  zksync: ethers.getAddress("0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4"),
  scroll: ethers.getAddress("0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"),
  linea: ethers.getAddress("0x176211869ca2b568f2a7d4ee941e073a821ee1ff"),
};

const ROUTER_ABI = [
  "function swap(((address pool, bytes data, address callback, bytes callbackData)[] steps, address tokenIn, uint256 amountIn)[] paths, uint256 amountOutMin, uint256 deadline) payable",
];

const FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB) view returns (address)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

function getRouterAddress(chain: string): string {
  const addr = ROUTER_ADDRESSES[chain.toLowerCase()];
  if (!addr) throw new Error(`SyncSwap not available on chain: ${chain}`);
  return addr;
}

function getFactoryAddress(chain: string): string {
  const addr = POOL_FACTORY_ADDRESSES[chain.toLowerCase()];
  if (!addr) throw new Error(`SyncSwap factory not available on chain: ${chain}`);
  return addr;
}

export async function getPool(
  chain: string,
  tokenA: string,
  tokenB: string
): Promise<string> {
  const provider = getProvider(chain);
  const factory = new ethers.Contract(
    getFactoryAddress(chain),
    FACTORY_ABI,
    provider
  );
  const pool: string = await factory.getPool(tokenA, tokenB);
  if (pool === ethers.ZeroAddress) {
    throw new Error(`No SyncSwap pool found for ${tokenA}/${tokenB} on ${chain}`);
  }
  return pool;
}

export async function swapSyncSwap(
  signer: ethers.Wallet,
  chain: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  slippagePct: number = 1.0
): Promise<string> {
  const routerAddr = getRouterAddress(chain);
  const router = new ethers.Contract(routerAddr, ROUTER_ABI, signer);
  const recipient = await signer.getAddress();

  const wethAddr = WETH_ADDRESSES[chain.toLowerCase()];
  const isEthIn =
    wethAddr && tokenIn.toLowerCase() === wethAddr.toLowerCase();

  // Resolve pool — use WETH address for ETH side
  const poolTokenIn = isEthIn ? wethAddr : tokenIn;
  const pool = await getPool(chain, poolTokenIn, tokenOut);

  // Approve token if not sending native ETH
  if (!isEthIn) {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, routerAddr);
    if (allowance < amountIn) {
      log.info(`Approving ${tokenIn.slice(0, 10)} for SyncSwap router on ${chain}`);
      const approveTx = await token.approve(routerAddr, amountIn);
      await approveTx.wait();
      log.success("Approval confirmed");
    }
  }

  // withdrawMode: 1 = native ETH, 2 = wrapped token
  const withdrawMode = tokenOut.toLowerCase() === wethAddr?.toLowerCase() ? 1 : 2;
  const swapData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint8"],
    [poolTokenIn, recipient, withdrawMode]
  );

  const steps = [
    {
      pool,
      data: swapData,
      callback: ethers.ZeroAddress,
      callbackData: "0x",
    },
  ];

  const paths = [
    {
      steps,
      tokenIn: isEthIn ? ethers.ZeroAddress : tokenIn,
      amountIn,
    },
  ];

  // Set minAmountOut to 0 — cross-token slippage calculation is unreliable with different decimals
  const minAmountOut = 0n;

  const block = await signer.provider!.getBlock("latest");
  const deadline = BigInt(block!.timestamp) + 1800n;

  log.info(
    `SyncSwap: swapping ${formatEth(amountIn)} on ${chain} via pool ${pool.slice(0, 10)}...`
  );

  const tx = await router.swap(paths, minAmountOut, deadline, {
    value: isEthIn ? amountIn : 0n,
  });
  const receipt = await tx.wait();

  log.tx(receipt.hash, `SyncSwap swap on ${chain}`);
  return receipt.hash;
}
