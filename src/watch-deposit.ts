import "dotenv/config";
import { ethers } from "ethers";

const POLL_MS = 45_000;
const MAX_MINUTES = Number(process.env.WATCH_MINUTES || "180");

const { loadWallets } = await import("./wallet-manager.js");
const { sendAlert } = await import("./safety/alerts.js");

const wallets = loadWallets();
if (wallets.length === 0) {
  console.error("No wallets found in data/wallets.enc.json");
  process.exit(1);
}
const w00 = wallets[0];

const rpc = process.env.RPC_ETHEREUM || "https://ethereum-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(rpc, 1);

const started = Date.now();
const deadline = started + MAX_MINUTES * 60_000;

const stamp = () => new Date().toISOString().slice(11, 19);

console.log(`[${stamp()}] Watching ${w00.address} on Ethereum Mainnet`);
console.log(`[${stamp()}] RPC: ${rpc}`);
console.log(`[${stamp()}] Polling every ${POLL_MS / 1000}s for up to ${MAX_MINUTES} min`);

// Watch for an INCREASE over what W00 already holds, not for any non-zero
// balance - W00 keeps a mainnet gas reserve between runs.
const baseline = await provider.getBalance(w00.address);
console.log(`[${stamp()}] baseline balance: ${ethers.formatEther(baseline)} ETH (alerting on any increase)`);

let polls = 0;
let consecutiveErrors = 0;

while (Date.now() < deadline) {
  try {
    const [balance, nonce] = await Promise.all([
      provider.getBalance(w00.address),
      provider.getTransactionCount(w00.address),
    ]);
    consecutiveErrors = 0;
    polls++;

    if (balance > baseline) {
      const eth = ethers.formatEther(balance);
      const delta = ethers.formatEther(balance - baseline);
      console.log(`\n[${stamp()}] *** DEPOSIT DETECTED ***`);
      console.log(`[${stamp()}] received: +${delta} ETH`);
      console.log(`[${stamp()}] W00 balance: ${eth} ETH  (nonce ${nonce})`);
      console.log(`[${stamp()}] https://etherscan.io/address/${w00.address}`);
      try {
        await sendAlert(
          `Deposit received in W00: *+${delta} ETH* on Ethereum Mainnet.\nW00 now holds ${eth} ETH. Ready to bridge to Unichain.`,
          "info",
        );
      } catch (e) {
        console.log(`[${stamp()}] (Telegram alert failed, deposit is still confirmed on-chain)`);
      }
      process.exit(0);
    }

    const mins = Math.round((Date.now() - started) / 60_000);
    if (polls % 4 === 1) {
      console.log(`[${stamp()}] still 0 ETH (nonce ${nonce}) — ${mins} min elapsed`);
    }
  } catch (err) {
    consecutiveErrors++;
    console.log(`[${stamp()}] RPC error (${consecutiveErrors}): ${(err as Error).message.slice(0, 120)}`);
    if (consecutiveErrors >= 10) {
      console.error(`[${stamp()}] 10 consecutive RPC failures — stopping. Check RPC_ETHEREUM in .env`);
      process.exit(1);
    }
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}

console.log(`[${stamp()}] ${MAX_MINUTES} min elapsed, no deposit seen. W00 still empty.`);
process.exit(2);
