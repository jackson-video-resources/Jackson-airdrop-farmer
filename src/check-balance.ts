import "dotenv/config";
import { loadWallets } from "./wallet-manager.js";
import { getProvider } from "./chains/index.js";
import { ethers } from "ethers";

async function main() {
  const wallets = loadWallets();
  const w0 = wallets[0];
  console.log("W00 address:", w0.address);

  const chains = ["ethereum", "base", "scroll", "linea", "zksync"];
  for (const chain of chains) {
    try {
      const provider = getProvider(chain);
      const balance = await provider.getBalance(w0.address);
      if (balance > 0n) {
        console.log(`  ${chain}: ${ethers.formatEther(balance)} ETH`);
      } else {
        console.log(`  ${chain}: 0`);
      }
    } catch {
      console.log(`  ${chain}: error`);
    }
  }
}

main().catch(console.error);
