import { ethers } from "ethers";

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: string;
  isL2: boolean;
  bridgeContract?: string;
}

const chains: Record<string, ChainConfig> = {
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: process.env.RPC_ETHEREUM || "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    nativeCurrency: "ETH",
    isL2: false,
  },
  base: {
    name: "Base",
    chainId: 8453,
    rpcUrl: process.env.RPC_BASE || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0x49048044d57e1c92a77f79988d21fa8faf74e97e"),
  },
  scroll: {
    name: "Scroll",
    chainId: 534352,
    rpcUrl: process.env.RPC_SCROLL || "https://rpc.scroll.io",
    explorerUrl: "https://scrollscan.com",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0xf8b1378579659d8f7ee5f3c929c2f3e332e41fd6"),
  },
  linea: {
    name: "Linea",
    chainId: 59144,
    rpcUrl: process.env.RPC_LINEA || "https://rpc.linea.build",
    explorerUrl: "https://lineascan.build",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0xd19d4b5d358258f05d7b411e21a1460d11b0876f"),
  },
  zksync: {
    name: "zkSync Era",
    chainId: 324,
    rpcUrl: process.env.RPC_ZKSYNC || "https://mainnet.era.zksync.io",
    explorerUrl: "https://explorer.zksync.io",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0x32400084c286cf3e17e7b677ea9583e60a000324"),
  },
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: process.env.RPC_ARBITRUM || "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"),
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: process.env.RPC_OPTIMISM || "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    nativeCurrency: "ETH",
    isL2: true,
    bridgeContract: ethers.getAddress("0xbEb5Fc579115071764c7423A4f12eDde41f106Ed"),
  },
};

const providerCache = new Map<string, ethers.JsonRpcProvider>();

export function getChain(name: string): ChainConfig {
  const chain = chains[name.toLowerCase()];
  if (!chain) throw new Error(`Unknown chain: ${name}. Available: ${Object.keys(chains).join(", ")}`);
  return chain;
}

export function getProvider(chain: string): ethers.JsonRpcProvider {
  const key = chain.toLowerCase();
  if (!providerCache.has(key)) {
    const config = getChain(key);
    providerCache.set(key, new ethers.JsonRpcProvider(config.rpcUrl));
  }
  return providerCache.get(key)!;
}

export function getSigner(chain: string, privateKey: string): ethers.Wallet {
  return new ethers.Wallet(privateKey, getProvider(chain));
}

export function getAllChains(): ChainConfig[] {
  return Object.values(chains);
}

export function getL2Chains(): ChainConfig[] {
  return Object.values(chains).filter((c) => c.isL2);
}

export const CHAIN_NAMES = Object.keys(chains);
