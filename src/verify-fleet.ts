import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey, getMnemonic } from "./wallet-manager.js";

const ws = loadWallets();
let ok = true;
for (const w of ws) {
  const derived = new ethers.Wallet(getPrivateKey(w)).address;
  const match = derived.toLowerCase() === w.address.toLowerCase();
  if (!match) ok = false;
  console.log(`  W${String(w.index).padStart(2, "0")}  decrypt->address: ${match ? "MATCH" : "MISMATCH"}`);
}
const m = getMnemonic();
console.log(`  mnemonic decrypts: ${!!m} (${m ? m.trim().split(/\s+/).length : 0} words)`);
if (m) {
  const re = ethers.HDNodeWallet.fromPhrase(m).deriveChild(0).address;
  const rematch = re.toLowerCase() === ws[0].address.toLowerCase();
  if (!rematch) ok = false;
  console.log(`  mnemonic re-derives W00: ${rematch ? "YES" : "NO"}`);
}
console.log(ok ? "\n  ENCRYPTION ROUND-TRIP OK - funds will be recoverable" : "\n  FAILURE - DO NOT FUND");
