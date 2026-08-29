import "dotenv/config";
import { loadWallets } from "./wallet-manager.js";
import { getProvider } from "./chains/index.js";
import { ethers } from "ethers";

async function main() {
  const wallets = loadWallets();
  console.log(`Total wallets: ${wallets.length}\n`);

  const chains = ["ethereum", "base", "scroll", "linea", "zksync", "arbitrum", "optimism", "megaeth", "abstract", "unichain"];

  for (const wallet of wallets) {
    const balances: string[] = [];
    for (const chain of chains) {
      try {
        const provider = getProvider(chain);
        const balance = await provider.getBalance(wallet.address);
        if (balance > 0n) {
          balances.push(`${chain}: ${ethers.formatEther(balance)}`);
        }
      } catch {
        // skip
      }
    }
    const balStr = balances.length > 0 ? balances.join(" | ") : "empty";
    console.log(`W${String(wallet.index).padStart(2, "0")} ${wallet.address.slice(0, 10)}...${wallet.address.slice(-4)} [${balStr}]`);
  }
}

main().catch(console.error);
