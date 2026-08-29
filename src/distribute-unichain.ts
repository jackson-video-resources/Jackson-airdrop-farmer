import "dotenv/config";
import { ethers } from "ethers";
import { withTimeout } from "./utils/timeout.js";

const { loadWallets, getPrivateKey } = await import("./wallet-manager.js");

const RPC = process.env.RPC_UNICHAIN || "https://mainnet.unichain.org";
const W00_RESERVE = ethers.parseEther("0.001");
const SKIP_THRESHOLD = ethers.parseEther("0.0003");

// batchMaxCount:1 -> one JSON-RPC call per HTTP request (no array batching)
// staticNetwork    -> skip chainId auto-detection round trips
const provider = new ethers.JsonRpcProvider(RPC, 130, {
  batchMaxCount: 1,
  staticNetwork: ethers.Network.from(130),
});

const t0 = Date.now();
const step = (msg: string) =>
  console.log(`[+${String(((Date.now() - t0) / 1000).toFixed(1)).padStart(6)}s] ${msg}`);



const wallets = loadWallets();
const w00 = wallets[0];
const recipients = wallets.slice(1);

step(`W00 = ${w00.address}`);
const balance = await withTimeout(provider.getBalance(w00.address), 20_000, "getBalance");
step(`balance = ${ethers.formatEther(balance)} ETH`);

const needsFunding = [];
for (const r of recipients) {
  const b = await withTimeout(provider.getBalance(r.address), 20_000, "getBalance recipient");
  if (b > SKIP_THRESHOLD) step(`  W${String(r.index).padStart(2, "0")} already funded (${ethers.formatEther(b)})`);
  else needsFunding.push(r);
}
if (needsFunding.length === 0) { step("nothing to do"); process.exit(0); }

const fee = await withTimeout(provider.getFeeData(), 20_000, "getFeeData");
const maxFee = (fee.maxFeePerGas ?? ethers.parseUnits("0.01", "gwei")) * 2n;
const maxPrio = fee.maxPriorityFeePerGas ?? ethers.parseUnits("0.001", "gwei");
step(`fees: maxFee=${ethers.formatUnits(maxFee, "gwei")} gwei prio=${ethers.formatUnits(maxPrio, "gwei")} gwei`);

const GAS_LIMIT = 21000n;
const gasReserve = GAS_LIMIT * maxFee * BigInt(needsFunding.length + 1);
const available = balance - (W00_RESERVE > gasReserve ? W00_RESERVE : gasReserve);
const perWallet = available / BigInt(needsFunding.length);
step(`sending ${ethers.formatEther(perWallet)} ETH to each of ${needsFunding.length}`);

const signer = new ethers.Wallet(getPrivateKey(w00), provider);
let nonce = await withTimeout(provider.getTransactionCount(w00.address, "pending"), 20_000, "getNonce");
step(`starting nonce = ${nonce}`);

for (const r of needsFunding) {
  const label = `W00 -> W${String(r.index).padStart(2, "0")}`;
  try {
    step(`${label}: building tx (nonce ${nonce})`);
    const tx = await withTimeout(
      signer.sendTransaction({
        to: r.address, value: perWallet, nonce: nonce++,
        gasLimit: GAS_LIMIT, maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPrio, chainId: 130,
      }),
      60_000, `${label} broadcast`,
    );
    step(`${label}: broadcast ${tx.hash}`);
    const rc = await withTimeout(tx.wait(1), 120_000, `${label} confirm`);
    step(`${label}: ${rc?.status === 1 ? "CONFIRMED" : "REVERTED"} in block ${rc?.blockNumber}`);
  } catch (e) {
    step(`${label}: FAILED - ${(e as Error).message.slice(0, 200)}`);
  }
}

step("--- final ---");
for (const w of wallets) {
  const b = await provider.getBalance(w.address);
  console.log(`  W${String(w.index).padStart(2, "0")} ${ethers.formatEther(b)} ETH`);
}
process.exit(0);
