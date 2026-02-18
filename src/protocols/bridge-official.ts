import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// L1 bridge contract addresses on Ethereum mainnet (checksummed via ethers.getAddress)
const BRIDGE_ADDRESSES: Record<string, string> = {
  base: ethers.getAddress("0x49048044d57e1c92a77f79988d21fa8faf74e97e"),
  scroll: ethers.getAddress("0x6774bcbd5cecef1336b5300fb5186a12ddd8b367"),
  linea: ethers.getAddress("0xd19d4b5d358258f05d7b411e21a1460d11b0876f"),
  zksync: ethers.getAddress("0x32400084c286cf3e17e7b677ea9583e60a000324"),
  arbitrum: ethers.getAddress("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"),
  optimism: ethers.getAddress("0xbEb5Fc579115071764c7423A4f12eDde41f106Ed"),
};

// Base (OptimismPortal2 — uses depositTransaction, not depositETH)
const BASE_BRIDGE_ABI = [
  "function depositTransaction(address _to, uint256 _value, uint64 _gasLimit, bool _isCreation, bytes _data) payable",
];

// Scroll L1ScrollMessenger
const SCROLL_BRIDGE_ABI = [
  "function sendMessage(address target, uint256 value, bytes message, uint256 gasLimit) payable",
];

// Linea L1 Message Service
const LINEA_BRIDGE_ABI = [
  "function sendMessage(address to, uint256 fee, bytes calldata) payable",
];

// zkSync Diamond Proxy
const ZKSYNC_BRIDGE_ABI = [
  "function requestL2Transaction(address contractL2, uint256 l2Value, bytes calldata, uint256 l2GasLimit, uint256 l2GasPerPubdataByteLimit, bytes[] factoryDeps, address refundRecipient) payable returns (bytes32)",
  "function l2TransactionBaseCost(uint256 gasPrice, uint256 l2GasLimit, uint256 l2GasPerPubdataByteLimit) view returns (uint256)",
];

// Arbitrum Delayed Inbox
const ARBITRUM_BRIDGE_ABI = [
  "function depositEth() payable returns (uint256)",
];

// Optimism OptimismPortal (same interface as Base OptimismPortal2)
const OPTIMISM_BRIDGE_ABI = [
  "function depositTransaction(address _to, uint256 _value, uint64 _gasLimit, bool _isCreation, bytes _data) payable",
];

async function bridgeToBase(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.base,
    BASE_BRIDGE_ABI,
    signer
  );
  const recipient = await signer.getAddress();

  const tx = await bridge.depositTransaction(
    recipient,   // _to: same address on Base
    amountWei,   // _value: ETH to credit on L2
    100000,      // _gasLimit: L2 gas
    false,       // _isCreation: not a contract creation
    "0x",        // _data: no calldata for simple ETH transfer
    { value: amountWei }
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

async function bridgeToScroll(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.scroll,
    SCROLL_BRIDGE_ABI,
    signer
  );
  const recipient = await signer.getAddress();

  // msg.value = amount + small fee for L2 gas
  const fee = ethers.parseEther("0.001");
  const msgValue = amountWei + fee;

  const tx = await bridge.sendMessage(recipient, amountWei, "0x", 168000, {
    value: msgValue,
  });
  const receipt = await tx.wait();
  return receipt.hash;
}

async function bridgeToLinea(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.linea,
    LINEA_BRIDGE_ABI,
    signer
  );
  const recipient = await signer.getAddress();

  const tx = await bridge.sendMessage(recipient, 0, "0x", {
    value: amountWei,
  });
  const receipt = await tx.wait();
  return receipt.hash;
}

async function bridgeToZkSync(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.zksync,
    ZKSYNC_BRIDGE_ABI,
    signer
  );
  const recipient = await signer.getAddress();

  const l2GasLimit = 733664n;
  const l2GasPerPubdata = 800n;

  // Query the base cost for the L2 transaction
  const gasPrice = (await signer.provider!.getFeeData()).gasPrice ?? 0n;
  const baseCost: bigint = await bridge.l2TransactionBaseCost(
    gasPrice,
    l2GasLimit,
    l2GasPerPubdata
  );

  const msgValue = amountWei + baseCost;

  const tx = await bridge.requestL2Transaction(
    recipient,
    amountWei,
    "0x",
    l2GasLimit,
    l2GasPerPubdata,
    [],
    recipient,
    { value: msgValue }
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

async function bridgeToArbitrum(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.arbitrum,
    ARBITRUM_BRIDGE_ABI,
    signer
  );

  const tx = await bridge.depositEth({ value: amountWei });
  const receipt = await tx.wait();
  return receipt.hash;
}

async function bridgeToOptimism(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const bridge = new ethers.Contract(
    BRIDGE_ADDRESSES.optimism,
    OPTIMISM_BRIDGE_ABI,
    signer
  );
  const recipient = await signer.getAddress();

  const tx = await bridge.depositTransaction(
    recipient,   // _to: same address on Optimism
    amountWei,   // _value: ETH to credit on L2
    100000,      // _gasLimit: L2 gas
    false,       // _isCreation: not a contract creation
    "0x",        // _data: no calldata for simple ETH transfer
    { value: amountWei }
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function bridgeToL2(
  signer: ethers.Wallet,
  targetChain: string,
  amountWei: bigint
): Promise<string> {
  const chain = targetChain.toLowerCase();

  if (!BRIDGE_ADDRESSES[chain]) {
    throw new Error(
      `No bridge available for chain: ${targetChain}. Available: ${Object.keys(BRIDGE_ADDRESSES).join(", ")}`
    );
  }

  log.info(`Bridging ${formatEth(amountWei)} ETH → ${targetChain}`);

  let txHash: string;

  switch (chain) {
    case "base":
      txHash = await bridgeToBase(signer, amountWei);
      break;
    case "scroll":
      txHash = await bridgeToScroll(signer, amountWei);
      break;
    case "linea":
      txHash = await bridgeToLinea(signer, amountWei);
      break;
    case "zksync":
      txHash = await bridgeToZkSync(signer, amountWei);
      break;
    case "arbitrum":
      txHash = await bridgeToArbitrum(signer, amountWei);
      break;
    case "optimism":
      txHash = await bridgeToOptimism(signer, amountWei);
      break;
    default:
      throw new Error(`Unsupported bridge target: ${targetChain}`);
  }

  log.tx(txHash, `bridge ETH → ${targetChain}`);
  return txHash;
}
