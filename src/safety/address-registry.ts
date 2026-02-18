import { ethers } from "ethers";

export interface KnownAddress {
  address: string;    // checksummed via ethers.getAddress()
  chain: string;
  protocol: string;   // "weth", "uniswap-v3", "syncswap", "bridge", "system"
  type: string;       // "token", "router", "factory", "bridge", "pool"
  label: string;      // human-readable description
}

/** All known-good addresses in the system */
const registry: KnownAddress[] = [
  // ── WETH contracts ──
  { address: ethers.getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"), chain: "ethereum", protocol: "weth", type: "token", label: "WETH (Ethereum)" },
  { address: ethers.getAddress("0x4200000000000000000000000000000000000006"), chain: "base", protocol: "weth", type: "token", label: "WETH (Base)" },
  { address: ethers.getAddress("0x5300000000000000000000000000000000000004"), chain: "scroll", protocol: "weth", type: "token", label: "WETH (Scroll)" },
  { address: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"), chain: "linea", protocol: "weth", type: "token", label: "WETH (Linea)" },
  { address: ethers.getAddress("0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"), chain: "zksync", protocol: "weth", type: "token", label: "WETH (zkSync)" },

  // ── USDC tokens ──
  { address: ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"), chain: "base", protocol: "system", type: "token", label: "USDC (Base)" },
  { address: ethers.getAddress("0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"), chain: "scroll", protocol: "system", type: "token", label: "USDC (Scroll)" },
  { address: ethers.getAddress("0x176211869ca2b568f2a7d4ee941e073a821ee1ff"), chain: "linea", protocol: "system", type: "token", label: "USDC (Linea)" },
  { address: ethers.getAddress("0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4"), chain: "zksync", protocol: "system", type: "token", label: "USDC (zkSync)" },

  // ── DAI token (Base) ──
  { address: ethers.getAddress("0x50c5725949a6f0c72e6c4a641f24049a917db0cb"), chain: "base", protocol: "system", type: "token", label: "DAI (Base)" },

  // ── Uniswap V3 (Base only) ──
  { address: ethers.getAddress("0x2626664c2603336e57b271c5c0b26f421741e481"), chain: "base", protocol: "uniswap-v3", type: "router", label: "Uniswap V3 SwapRouter (Base)" },

  // ── SyncSwap routers ──
  { address: ethers.getAddress("0x2da10a1e27bf85cedd8ffb1abbe97e53391c0295"), chain: "zksync", protocol: "syncswap", type: "router", label: "SyncSwap Router (zkSync)" },
  { address: ethers.getAddress("0x80e38291e06339d10aab483c65695d004dbd5c69"), chain: "scroll", protocol: "syncswap", type: "router", label: "SyncSwap Router (Scroll)" },
  { address: ethers.getAddress("0x80e38291e06339d10aab483c65695d004dbd5c69"), chain: "linea", protocol: "syncswap", type: "router", label: "SyncSwap Router (Linea)" },

  // ── SyncSwap pool factories ──
  { address: ethers.getAddress("0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb"), chain: "zksync", protocol: "syncswap", type: "factory", label: "SyncSwap Factory (zkSync)" },
  { address: ethers.getAddress("0x37bac764494c8db4e54bde72f6965bea9fa0ac2d"), chain: "scroll", protocol: "syncswap", type: "factory", label: "SyncSwap Factory (Scroll)" },
  { address: ethers.getAddress("0x37bac764494c8db4e54bde72f6965bea9fa0ac2d"), chain: "linea", protocol: "syncswap", type: "factory", label: "SyncSwap Factory (Linea)" },

  // ── WETH + USDC (Arbitrum & Optimism) ──
  { address: ethers.getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"), chain: "arbitrum", protocol: "weth", type: "token", label: "WETH (Arbitrum)" },
  { address: ethers.getAddress("0x4200000000000000000000000000000000000006"), chain: "optimism", protocol: "weth", type: "token", label: "WETH (Optimism)" },
  { address: ethers.getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"), chain: "arbitrum", protocol: "system", type: "token", label: "USDC (Arbitrum)" },
  { address: ethers.getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"), chain: "optimism", protocol: "system", type: "token", label: "USDC (Optimism)" },

  // ── Aave V3 Pool contracts ──
  { address: ethers.getAddress("0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"), chain: "base", protocol: "aave-v3", type: "router", label: "Aave V3 Pool (Base)" },
  { address: ethers.getAddress("0x11fCfe756c05AD438e312a7fd934381537D3cFfe"), chain: "scroll", protocol: "aave-v3", type: "router", label: "Aave V3 Pool (Scroll)" },
  { address: ethers.getAddress("0xc47b8c00b0f69a36fa203ffeac0334874574a8ac"), chain: "linea", protocol: "aave-v3", type: "router", label: "Aave V3 Pool (Linea)" },
  { address: ethers.getAddress("0x794a61358D6845594F94dc1DB02A252b5b4814aD"), chain: "arbitrum", protocol: "aave-v3", type: "router", label: "Aave V3 Pool (Arbitrum)" },
  { address: ethers.getAddress("0x794a61358D6845594F94dc1DB02A252b5b4814aD"), chain: "optimism", protocol: "aave-v3", type: "router", label: "Aave V3 Pool (Optimism)" },

  // ── Orbiter Finance router (same on all chains) ──
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "base", protocol: "orbiter", type: "router", label: "Orbiter Router" },
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "scroll", protocol: "orbiter", type: "router", label: "Orbiter Router" },
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "linea", protocol: "orbiter", type: "router", label: "Orbiter Router" },
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "zksync", protocol: "orbiter", type: "router", label: "Orbiter Router" },
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "arbitrum", protocol: "orbiter", type: "router", label: "Orbiter Router" },
  { address: ethers.getAddress("0xe4edb277e41dc89ab076a1f049f4a3efa700bce8"), chain: "optimism", protocol: "orbiter", type: "router", label: "Orbiter Router" },

  // ── Ambient (Scroll) ──
  { address: ethers.getAddress("0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106"), chain: "scroll", protocol: "ambient", type: "router", label: "Ambient CrocSwapDex (Scroll)" },

  // ── Velodrome / Aerodrome ──
  { address: ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"), chain: "optimism", protocol: "velodrome", type: "router", label: "Velodrome V2 Router (Optimism)" },
  { address: ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"), chain: "base", protocol: "aerodrome", type: "router", label: "Aerodrome Router (Base)" },

  // ── EigenLayer (Ethereum) ──
  { address: ethers.getAddress("0x858646372CC42E1A627fcE94aa7A7033e7CF075A"), chain: "ethereum", protocol: "eigenlayer", type: "router", label: "EigenLayer StrategyManager" },
  { address: ethers.getAddress("0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A"), chain: "ethereum", protocol: "eigenlayer", type: "router", label: "EigenLayer DelegationManager" },
  { address: ethers.getAddress("0x93c4b944D05dfe6df7645A86cd2206016c51564D"), chain: "ethereum", protocol: "eigenlayer", type: "router", label: "EigenLayer stETH Strategy" },
  { address: ethers.getAddress("0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"), chain: "ethereum", protocol: "lido", type: "token", label: "stETH (Lido)" },

  // ── Zora (Base) ──
  { address: ethers.getAddress("0x777777C338d93e2C7adf08D102d45CA7CC4Ed021"), chain: "base", protocol: "zora", type: "factory", label: "Zora 1155 Factory" },
  { address: ethers.getAddress("0x777777722D078c97c6ad07d9f36801e653E356Ae"), chain: "base", protocol: "zora", type: "router", label: "Zora TimedSaleStrategy" },

  // ── Pendle (Arbitrum) ──
  { address: ethers.getAddress("0x888888888889758F76e7103c6CbF23ABbF58F946"), chain: "arbitrum", protocol: "pendle", type: "router", label: "Pendle Router V4 (Arbitrum)" },
  { address: ethers.getAddress("0x888888888889758F76e7103c6CbF23ABbF58F946"), chain: "ethereum", protocol: "pendle", type: "router", label: "Pendle Router V4 (Ethereum)" },

  // ── Stargate V2 pools ──
  { address: ethers.getAddress("0xdc181Bd607330aeeBEF6ea62e03e5e1Fb4B6F7C7"), chain: "base", protocol: "stargate", type: "router", label: "Stargate PoolNative (Base)" },
  { address: ethers.getAddress("0xC2b638Cb5042c1B3c5d5C969361fB50569840583"), chain: "scroll", protocol: "stargate", type: "router", label: "Stargate PoolNative (Scroll)" },
  { address: ethers.getAddress("0x81F6138153d473E8c5EcebD3DC8Cd4903506B075"), chain: "linea", protocol: "stargate", type: "router", label: "Stargate PoolNative (Linea)" },
  { address: ethers.getAddress("0xA45B5130f36CDcA45667738e2a258AB09f4A5f7F"), chain: "arbitrum", protocol: "stargate", type: "router", label: "Stargate PoolNative (Arbitrum)" },
  { address: ethers.getAddress("0xe8CDF27AcD73a434D661C84887215F7598e7d0d3"), chain: "optimism", protocol: "stargate", type: "router", label: "Stargate PoolNative (Optimism)" },

  // ── L1 → L2 Bridge contracts (on Ethereum) ──
  { address: ethers.getAddress("0x49048044d57e1c92a77f79988d21fa8faf74e97e"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "Base OptimismPortal2" },
  { address: ethers.getAddress("0x6774bcbd5cecef1336b5300fb5186a12ddd8b367"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "Scroll L1ScrollMessenger" },
  { address: ethers.getAddress("0xd19d4b5d358258f05d7b411e21a1460d11b0876f"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "Linea L1MessageService" },
  { address: ethers.getAddress("0x32400084c286cf3e17e7b677ea9583e60a000324"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "zkSync DiamondProxy" },
  { address: ethers.getAddress("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "Arbitrum Delayed Inbox" },
  { address: ethers.getAddress("0xbEb5Fc579115071764c7423A4f12eDde41f106Ed"), chain: "ethereum", protocol: "bridge", type: "bridge", label: "Optimism OptimismPortal" },
];

/** Runtime-registered addresses (e.g. SyncSwap pool discoveries) */
const runtimeAddresses: KnownAddress[] = [];

function normalize(addr: string): string {
  return addr.toLowerCase();
}

/** Check if an address is in the known-good registry */
export function isKnownAddress(chain: string, address: string): boolean {
  const norm = normalize(address);
  return [...registry, ...runtimeAddresses].some(
    (a) => normalize(a.address) === norm && a.chain === chain
  );
}

/** Check if an address is known on ANY chain (for cross-chain lookups) */
export function isKnownAddressAnyChain(address: string): boolean {
  const norm = normalize(address);
  return [...registry, ...runtimeAddresses].some(
    (a) => normalize(a.address) === norm
  );
}

/** Get info about a known address */
export function getAddressInfo(chain: string, address: string): KnownAddress | null {
  const norm = normalize(address);
  return [...registry, ...runtimeAddresses].find(
    (a) => normalize(a.address) === norm && a.chain === chain
  ) ?? null;
}

/** Validate an address is known — throws if not */
export function validateTarget(chain: string, address: string, context?: string): void {
  if (!isKnownAddress(chain, address)) {
    const ctx = context ? ` (${context})` : "";
    throw new Error(
      `SAFETY: Unknown address ${address} on ${chain}${ctx}. ` +
      `Register it in the address registry before interacting.`
    );
  }
}

/** Register a new address at runtime (e.g. pool discovered via factory) */
export function registerAddress(entry: KnownAddress): void {
  const norm = normalize(entry.address);
  const exists = [...registry, ...runtimeAddresses].some(
    (a) => normalize(a.address) === norm && a.chain === entry.chain
  );
  if (!exists) {
    runtimeAddresses.push({
      ...entry,
      address: ethers.getAddress(entry.address), // ensure checksum
    });
  }
}

/** Get all known addresses */
export function getAllAddresses(): KnownAddress[] {
  return [...registry, ...runtimeAddresses];
}

/** Get all known router/spender addresses for a chain (for allowance scanning) */
export function getRouterAddresses(chain: string): KnownAddress[] {
  return [...registry, ...runtimeAddresses].filter(
    (a) => a.chain === chain && a.type === "router"
  );
}

/** Get all known token addresses for a chain */
export function getTokenAddresses(chain: string): KnownAddress[] {
  return [...registry, ...runtimeAddresses].filter(
    (a) => a.chain === chain && a.type === "token"
  );
}
