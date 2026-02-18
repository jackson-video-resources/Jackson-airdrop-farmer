import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// Pendle Router V4 — same CREATE2 address on Ethereum, Arbitrum, Optimism
const PENDLE_ROUTER = ethers.getAddress(
  "0x888888888889758F76e7103c6CbF23ABbF58F946"
);

const WETH_ADDRESSES: Record<string, string> = {
  arbitrum: ethers.getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
  ethereum: ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  optimism: ethers.getAddress("0x4200000000000000000000000000000000000006"),
};

// Active markets — markets expire so these need periodic updates.
// Check https://app.pendle.finance for current markets.
export const PENDLE_MARKETS: Record<string, Record<string, string>> = {
  arbitrum: {
    "weETH-26JUN2026": ethers.getAddress(
      "0x46d62a8dede1bf2d0de04f2ed863245cbba5e538"
    ),
  },
};

// ── ABI component definitions (Pendle V2 structs are deeply nested) ─────────

const SwapDataComponents = [
  { name: "swapType", type: "uint8" },
  { name: "extRouter", type: "address" },
  { name: "extCalldata", type: "bytes" },
  { name: "needScale", type: "bool" },
];

const OrderComponents = [
  { name: "salt", type: "uint256" },
  { name: "expiry", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "orderType", type: "uint8" },
  { name: "token", type: "address" },
  { name: "YT", type: "address" },
  { name: "maker", type: "address" },
  { name: "receiver", type: "address" },
  { name: "makingAmount", type: "uint256" },
  { name: "lnImpliedRate", type: "uint256" },
  { name: "failSafeRate", type: "uint256" },
  { name: "permit", type: "bytes" },
];

const FillOrderParamsComponents = [
  { name: "order", type: "tuple", components: OrderComponents },
  { name: "signature", type: "bytes" },
  { name: "makingAmount", type: "uint256" },
];

const LimitOrderDataParam = {
  name: "limit",
  type: "tuple",
  components: [
    { name: "limitRouter", type: "address" },
    { name: "epsSkipMarket", type: "uint256" },
    {
      name: "normalFills",
      type: "tuple[]",
      components: FillOrderParamsComponents,
    },
    {
      name: "flashFills",
      type: "tuple[]",
      components: FillOrderParamsComponents,
    },
    { name: "optData", type: "bytes" },
  ],
};

const ApproxParamsParam = {
  name: "guessPtOut",
  type: "tuple",
  components: [
    { name: "guessMin", type: "uint256" },
    { name: "guessMax", type: "uint256" },
    { name: "guessOffchain", type: "uint256" },
    { name: "maxIteration", type: "uint256" },
    { name: "eps", type: "uint256" },
  ],
};

const TokenInputParam = {
  name: "input",
  type: "tuple",
  components: [
    { name: "tokenIn", type: "address" },
    { name: "netTokenIn", type: "uint256" },
    { name: "tokenMintSy", type: "address" },
    { name: "pendleSwap", type: "address" },
    { name: "swapData", type: "tuple", components: SwapDataComponents },
  ],
};

const TokenOutputParam = {
  name: "output",
  type: "tuple",
  components: [
    { name: "tokenOut", type: "address" },
    { name: "minTokenOut", type: "uint256" },
    { name: "tokenRedeemSy", type: "address" },
    { name: "pendleSwap", type: "address" },
    { name: "swapData", type: "tuple", components: SwapDataComponents },
  ],
};

// ── Full JSON ABI for Pendle Router V4 swap functions ───────────────────────

const PENDLE_ROUTER_ABI = [
  {
    type: "function",
    name: "swapExactTokenForPt",
    stateMutability: "payable",
    inputs: [
      { name: "receiver", type: "address" },
      { name: "market", type: "address" },
      { name: "minPtOut", type: "uint256" },
      ApproxParamsParam,
      TokenInputParam,
      LimitOrderDataParam,
    ],
    outputs: [
      { name: "netPtOut", type: "uint256" },
      { name: "netSyFee", type: "uint256" },
      { name: "netSyInterm", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "swapExactPtForToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiver", type: "address" },
      { name: "market", type: "address" },
      { name: "exactPtIn", type: "uint256" },
      TokenOutputParam,
      LimitOrderDataParam,
    ],
    outputs: [
      { name: "netTokenOut", type: "uint256" },
      { name: "netSyFee", type: "uint256" },
      { name: "netSyInterm", type: "uint256" },
    ],
  },
];

const MARKET_ABI = [
  "function readTokens() view returns (address _SY, address _PT, address _YT)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

// ── Parameter helpers ───────────────────────────────────────────────────────

function defaultApproxParams() {
  return {
    guessMin: 0n,
    guessMax: ethers.MaxUint256,
    guessOffchain: 0n,
    maxIteration: 256n,
    eps: 10n ** 15n, // 0.1% precision
  };
}

function emptyLimitOrderData() {
  return {
    limitRouter: ethers.ZeroAddress,
    epsSkipMarket: 0n,
    normalFills: [],
    flashFills: [],
    optData: "0x",
  };
}

function createTokenInput(
  tokenIn: string,
  amountIn: bigint,
  tokenMintSy: string
) {
  return {
    tokenIn,
    netTokenIn: amountIn,
    tokenMintSy,
    pendleSwap: ethers.ZeroAddress,
    swapData: {
      swapType: 0,
      extRouter: ethers.ZeroAddress,
      extCalldata: "0x",
      needScale: false,
    },
  };
}

function createTokenOutput(tokenOut: string, tokenRedeemSy: string) {
  return {
    tokenOut,
    minTokenOut: 0n, // accept any — small farming amounts make MEV uneconomical
    tokenRedeemSy,
    pendleSwap: ethers.ZeroAddress,
    swapData: {
      swapType: 0,
      extRouter: ethers.ZeroAddress,
      extCalldata: "0x",
      needScale: false,
    },
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Read the SY, PT, and YT token addresses from a Pendle market contract. */
export async function getMarketTokens(
  provider: ethers.Provider,
  market: string
): Promise<{ sy: string; pt: string; yt: string }> {
  const marketContract = new ethers.Contract(market, MARKET_ABI, provider);
  const [sy, pt, yt] = await marketContract.readTokens();
  return { sy, pt, yt };
}

/**
 * Swap an ERC-20 token (or native ETH) for Principal Tokens (PT) on Pendle.
 *
 * For native ETH input, pass `tokenIn` as the chain's WETH address or
 * `ethers.ZeroAddress`. The function sends ETH as msg.value automatically.
 *
 * `tokenMintSy` controls which token the SY contract uses to mint SY
 * internally. For straightforward cases (e.g. WETH into a wstETH market)
 * this equals `tokenIn`. For markets where the SY accepts a different
 * underlying, pass the appropriate token address.
 */
export async function pendleSwapForPT(
  signer: ethers.Wallet,
  chain: string,
  market: string,
  tokenIn: string,
  amountIn: bigint,
  tokenMintSy?: string
): Promise<string> {
  const router = new ethers.Contract(PENDLE_ROUTER, PENDLE_ROUTER_ABI, signer);
  const recipient = await signer.getAddress();

  const wethAddr = WETH_ADDRESSES[chain.toLowerCase()];
  const isNativeEth =
    tokenIn === ethers.ZeroAddress ||
    (wethAddr && tokenIn.toLowerCase() === wethAddr.toLowerCase());

  // For native ETH, Pendle expects tokenIn = ZeroAddress with msg.value
  const actualTokenIn = isNativeEth ? ethers.ZeroAddress : tokenIn;
  const mintSy = tokenMintSy ?? actualTokenIn;

  // Approve ERC-20 spend if not native ETH
  if (!isNativeEth) {
    const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
    const allowance: bigint = await token.allowance(recipient, PENDLE_ROUTER);
    if (allowance < amountIn) {
      log.info(
        `Approving ${tokenIn.slice(0, 10)} for Pendle Router on ${chain}`
      );
      const approveTx = await token.approve(PENDLE_ROUTER, amountIn);
      await approveTx.wait();
      log.success("Approval confirmed");
    }
  }

  log.info(
    `Pendle: buying PT with ${formatEth(amountIn)} ${isNativeEth ? "ETH" : tokenIn.slice(0, 10)} on ${chain}`
  );

  const tx = await router.swapExactTokenForPt(
    recipient,
    market,
    0n, // minPtOut — accept any for small farming amounts
    defaultApproxParams(),
    createTokenInput(actualTokenIn, amountIn, mintSy),
    emptyLimitOrderData(),
    { value: isNativeEth ? amountIn : 0n }
  );
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Pendle buy PT on ${chain}`);
  return receipt.hash;
}

/**
 * Swap Principal Tokens (PT) back for an ERC-20 token (or native ETH).
 *
 * Reads the PT address from the market contract and approves the router
 * to spend `ptAmount` of PT before executing the swap.
 */
export async function pendleSwapPTForToken(
  signer: ethers.Wallet,
  chain: string,
  market: string,
  tokenOut: string,
  ptAmount: bigint,
  tokenRedeemSy?: string
): Promise<string> {
  const router = new ethers.Contract(PENDLE_ROUTER, PENDLE_ROUTER_ABI, signer);
  const recipient = await signer.getAddress();

  // Read PT address from the market
  const { pt: ptAddress } = await getMarketTokens(signer.provider!, market);

  // Approve PT for the router
  const pt = new ethers.Contract(ptAddress, ERC20_ABI, signer);
  const allowance: bigint = await pt.allowance(recipient, PENDLE_ROUTER);
  if (allowance < ptAmount) {
    log.info(`Approving PT (${ptAddress.slice(0, 10)}) for Pendle Router on ${chain}`);
    const approveTx = await pt.approve(PENDLE_ROUTER, ptAmount);
    await approveTx.wait();
    log.success("PT approval confirmed");
  }

  const wethAddr = WETH_ADDRESSES[chain.toLowerCase()];
  const isNativeEth =
    tokenOut === ethers.ZeroAddress ||
    (wethAddr && tokenOut.toLowerCase() === wethAddr.toLowerCase());

  const actualTokenOut = isNativeEth ? ethers.ZeroAddress : tokenOut;
  const redeemSy = tokenRedeemSy ?? actualTokenOut;

  log.info(
    `Pendle: selling PT for ${isNativeEth ? "ETH" : tokenOut.slice(0, 10)} on ${chain}`
  );

  const tx = await router.swapExactPtForToken(
    recipient,
    market,
    ptAmount,
    createTokenOutput(actualTokenOut, redeemSy),
    emptyLimitOrderData()
  );
  const receipt = await tx.wait();

  log.tx(receipt.hash, `Pendle sell PT on ${chain}`);
  return receipt.hash;
}

/**
 * Convenience: read how many PT tokens the wallet holds for a given market.
 */
export async function getPTBalance(
  provider: ethers.Provider,
  market: string,
  wallet: string
): Promise<bigint> {
  const { pt } = await getMarketTokens(provider, market);
  const ptContract = new ethers.Contract(pt, ERC20_ABI, provider);
  return ptContract.balanceOf(wallet);
}
