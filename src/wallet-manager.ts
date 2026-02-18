import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { encrypt, decrypt } from "./utils/crypto.js";
import { getProvider } from "./chains/index.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = path.resolve(__dirname, "../data/wallets.enc.json");

export interface StoredWallet {
  index: number;
  label: string;
  address: string;
  encryptedKey: string;
}

interface WalletStore {
  encryptedMnemonic: string | null;
  wallets: StoredWallet[];
}

function loadStore(): WalletStore {
  if (!existsSync(WALLET_FILE)) {
    return { encryptedMnemonic: null, wallets: [] };
  }
  return JSON.parse(readFileSync(WALLET_FILE, "utf-8"));
}

function saveStore(store: WalletStore): void {
  writeFileSync(WALLET_FILE, JSON.stringify(store, null, 2));
}

/** Generate a new wallet fleet from a fresh mnemonic */
export function generateFleet(count: number): {
  mnemonic: string;
  wallets: { index: number; address: string; privateKey: string }[];
} {
  const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const child = hdNode.deriveChild(i);
    wallets.push({
      index: i,
      address: child.address,
      privateKey: child.privateKey,
    });
  }

  return { mnemonic, wallets };
}

/** Save generated wallets to encrypted file */
export function saveFleet(
  mnemonic: string,
  wallets: { index: number; address: string; privateKey: string }[],
  labels?: string[]
): void {
  const store: WalletStore = {
    encryptedMnemonic: encrypt(mnemonic),
    wallets: wallets.map((w, i) => ({
      index: w.index,
      label: labels?.[i] || `wallet-${w.index}`,
      address: w.address,
      encryptedKey: encrypt(w.privateKey),
    })),
  };
  saveStore(store);
  log.success(`Saved ${wallets.length} wallets to encrypted store`);
}

/** Load all wallets from store */
export function loadWallets(): StoredWallet[] {
  return loadStore().wallets;
}

/** Get decrypted private key for a wallet */
export function getPrivateKey(wallet: StoredWallet): string {
  return decrypt(wallet.encryptedKey);
}

/** Get the master mnemonic */
export function getMnemonic(): string | null {
  const store = loadStore();
  if (!store.encryptedMnemonic) return null;
  return decrypt(store.encryptedMnemonic);
}

/** Add more wallets to the fleet from the same mnemonic */
export function expandFleet(additionalCount: number): StoredWallet[] {
  const store = loadStore();
  if (!store.encryptedMnemonic) throw new Error("No mnemonic found. Generate a fleet first.");

  const mnemonic = decrypt(store.encryptedMnemonic);
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const startIndex = store.wallets.length;
  const newWallets: StoredWallet[] = [];

  for (let i = 0; i < additionalCount; i++) {
    const idx = startIndex + i;
    const child = hdNode.deriveChild(idx);
    const wallet: StoredWallet = {
      index: idx,
      label: `wallet-${idx}`,
      address: child.address,
      encryptedKey: encrypt(child.privateKey),
    };
    store.wallets.push(wallet);
    newWallets.push(wallet);
  }

  saveStore(store);
  log.success(`Added ${additionalCount} wallets (total: ${store.wallets.length})`);
  return newWallets;
}

/** Check balances across all chains for all wallets */
export async function checkBalances(
  chains: string[] = ["ethereum", "base", "scroll", "linea", "zksync"]
): Promise<Map<string, Map<string, bigint>>> {
  const wallets = loadWallets();
  const results = new Map<string, Map<string, bigint>>();

  for (const wallet of wallets) {
    const balances = new Map<string, bigint>();
    for (const chain of chains) {
      try {
        const provider = getProvider(chain);
        const balance = await provider.getBalance(wallet.address);
        balances.set(chain, balance);
      } catch {
        balances.set(chain, 0n);
      }
    }
    results.set(wallet.address, balances);
  }

  return results;
}

/** Print balance table */
export async function printBalances(): Promise<void> {
  const wallets = loadWallets();
  if (wallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first.");
    return;
  }

  const chains = ["ethereum", "base", "scroll", "linea", "zksync"];
  log.info(`Checking balances for ${wallets.length} wallets across ${chains.length} chains...`);
  log.divider();

  for (const wallet of wallets) {
    const parts: string[] = [];
    for (const chain of chains) {
      try {
        const provider = getProvider(chain);
        const balance = await provider.getBalance(wallet.address);
        if (balance > 0n) {
          parts.push(`${chain}: ${formatEth(balance)} ETH`);
        }
      } catch {
        // skip
      }
    }
    const balStr = parts.length > 0 ? parts.join(" | ") : "empty";
    log.wallet(
      wallet.index,
      wallet.label,
      `${wallet.address.slice(0, 8)}...${wallet.address.slice(-4)} [${balStr}]`
    );
  }
  log.divider();
}

/** Get total fleet value on a specific chain */
export async function getFleetBalance(chain: string): Promise<{ total: bigint; perWallet: Map<string, bigint> }> {
  const wallets = loadWallets();
  const provider = getProvider(chain);
  let total = 0n;
  const perWallet = new Map<string, bigint>();

  for (const wallet of wallets) {
    const balance = await provider.getBalance(wallet.address);
    total += balance;
    perWallet.set(wallet.address, balance);
  }

  return { total, perWallet };
}
