import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// StargatePoolNative contract addresses per chain
const POOL_NATIVE: Record<string, string> = {
  ethereum: "0x77b2043768d28E9C9aB44E1aBfC95944bcE57931",
  arbitrum: "0xA45B5130f36CDcA45667738e2a258AB09f4A5f7F",
  optimism: "0xe8CDF27AcD73a434D661C84887215F7598e7d0d3",
  base: "0xdc181Bd607330aeeBEF6ea62e03e5e1Fb4B6F7C7",
  scroll: "0xC2b638Cb5042c1B3c5d5C969361fB50569840583",
  linea: "0x81F6138153d473E8c5EcebD3DC8Cd4903506B075",
};

// LayerZero V2 endpoint IDs
const LZ_EID: Record<string, number> = {
  ethereum: 30101,
  arbitrum: 30110,
  optimism: 30111,
  base: 30184,
  scroll: 30214,
  linea: 30183,
};

const ABI = [
  "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, bool _payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee))",
  "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) _sendParam, (uint256 nativeFee, uint256 lzTokenFee) _fee, address _refundAddress) payable returns ((bytes32 guid, uint64 nonce, uint256 fee), (uint256 amountSentLD, uint256 amountReceivedLD))",
];

/**
 * Bridge native ETH via Stargate V2 (LayerZero OFT).
 * Uses taxi mode for immediate delivery.
 */
export async function bridgeStargate(
  signer: ethers.Wallet,
  fromChain: string,
  toChain: string,
  amountWei: bigint
): Promise<string> {
  const src = fromChain.toLowerCase();
  const dst = toChain.toLowerCase();

  const poolAddress = POOL_NATIVE[src];
  if (!poolAddress) {
    throw new Error(
      `Stargate: no pool on ${fromChain}. Available: ${Object.keys(POOL_NATIVE).join(", ")}`
    );
  }

  const dstEid = LZ_EID[dst];
  if (!dstEid) {
    throw new Error(
      `Stargate: unknown destination ${toChain}. Available: ${Object.keys(LZ_EID).join(", ")}`
    );
  }

  const contract = new ethers.Contract(poolAddress, ABI, signer);
  const recipient = await signer.getAddress();

  // Encode address as bytes32 (left-padded)
  const toBytes32 = ethers.zeroPadValue(recipient, 32);

  // 0.5% slippage tolerance
  const minAmountLD = (amountWei * 995n) / 1000n;

  const sendParam = {
    dstEid,
    to: toBytes32,
    amountLD: amountWei,
    minAmountLD,
    extraOptions: "0x",  // Stargate handles executor options automatically
    composeMsg: "0x",    // No composed message
    oftCmd: "0x",        // Empty = taxi mode (immediate)
  };

  // Quote the messaging fee
  const messagingFee = await contract.quoteSend(sendParam, false);
  const nativeFee: bigint = messagingFee.nativeFee;

  log.info(
    `Stargate bridge ${formatEth(amountWei)} ETH ${fromChain} → ${toChain} (fee: ${formatEth(nativeFee)})`
  );

  // For native ETH: msg.value = amountLD + nativeFee
  const tx = await contract.send(
    sendParam,
    { nativeFee, lzTokenFee: 0n },
    recipient,
    { value: amountWei + nativeFee }
  );

  const receipt = await tx.wait();
  log.tx(receipt.hash, `Stargate bridge ${fromChain} → ${toChain}`);
  return receipt.hash;
}
