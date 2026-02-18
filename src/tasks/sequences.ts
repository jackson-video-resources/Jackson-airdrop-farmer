import type { TaskSequence } from "./types.js";

const sequences: TaskSequence[] = [
  {
    name: "base-warmup",
    description: "Basic Base chain activity — bridge, swap, wrap/unwrap, deploy",
    chains: ["base"],
    tasks: [
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "base" } },
      { type: "wrap_eth", chain: "base", params: {} },
      { type: "dex_swap", chain: "base", protocol: "uniswap-v3", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "base", protocol: "uniswap-v3", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "base", params: {} },
      { type: "deploy_contract", chain: "base", params: {} },
    ],
  },
  {
    name: "scroll-farmer",
    description: "Scroll chain farming — bridge, swap, wrap/unwrap, deploy",
    chains: ["scroll"],
    tasks: [
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "scroll" } },
      { type: "wrap_eth", chain: "scroll", params: {} },
      { type: "dex_swap", chain: "scroll", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "scroll", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "scroll", params: {} },
      { type: "deploy_contract", chain: "scroll", params: {} },
    ],
  },
  {
    name: "linea-farmer",
    description: "Linea chain farming — bridge, swap, wrap/unwrap",
    chains: ["linea"],
    tasks: [
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "linea" } },
      { type: "wrap_eth", chain: "linea", params: {} },
      { type: "dex_swap", chain: "linea", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "linea", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "linea", params: {} },
    ],
  },
  {
    name: "zksync-farmer",
    description: "zkSync Era farming — bridge, swap, wrap/unwrap, deploy",
    chains: ["zksync"],
    tasks: [
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "zksync" } },
      { type: "wrap_eth", chain: "zksync", params: {} },
      { type: "dex_swap", chain: "zksync", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "zksync", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "zksync", params: {} },
      { type: "deploy_contract", chain: "zksync", params: {} },
    ],
  },
  {
    name: "multi-chain-light",
    description: "Touch multiple chains lightly — bridge and one action each",
    chains: ["base", "scroll", "linea"],
    tasks: [
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "base" } },
      { type: "dex_swap", chain: "base", protocol: "uniswap-v3", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "scroll" } },
      { type: "dex_swap", chain: "scroll", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "bridge_to_l2", chain: "ethereum", params: { targetChain: "linea" } },
      { type: "wrap_eth", chain: "linea", params: {} },
      { type: "unwrap_eth", chain: "linea", params: {} },
    ],
  },

  // ── L2-only activity sequences (no bridge, for scheduled farming) ──

  {
    name: "base-activity",
    description: "Base L2 activity — wrap, swap round-trip, unwrap (no bridge)",
    chains: ["base"],
    tasks: [
      { type: "wrap_eth", chain: "base", params: {} },
      { type: "dex_swap", chain: "base", protocol: "uniswap-v3", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "base", protocol: "uniswap-v3", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "base", params: {} },
    ],
  },
  {
    name: "scroll-activity",
    description: "Scroll L2 activity — wrap, swap round-trip, unwrap (no bridge)",
    chains: ["scroll"],
    tasks: [
      { type: "wrap_eth", chain: "scroll", params: {} },
      { type: "dex_swap", chain: "scroll", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "scroll", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "scroll", params: {} },
    ],
  },
  {
    name: "linea-activity",
    description: "Linea L2 activity — wrap, swap round-trip, unwrap (no bridge)",
    chains: ["linea"],
    tasks: [
      { type: "wrap_eth", chain: "linea", params: {} },
      { type: "dex_swap", chain: "linea", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "linea", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "linea", params: {} },
    ],
  },
  {
    name: "zksync-activity",
    description: "zkSync L2 activity — wrap, swap round-trip, unwrap (no bridge)",
    chains: ["zksync"],
    tasks: [
      { type: "wrap_eth", chain: "zksync", params: {} },
      { type: "dex_swap", chain: "zksync", protocol: "syncswap", params: { tokenIn: "ETH", tokenOut: "USDC" } },
      { type: "dex_swap", chain: "zksync", protocol: "syncswap", params: { tokenIn: "USDC", tokenOut: "ETH" } },
      { type: "unwrap_eth", chain: "zksync", params: {} },
    ],
  },
];

/** Get a sequence by name */
export function getSequence(name: string): TaskSequence {
  const seq = sequences.find((s) => s.name === name);
  if (!seq) {
    throw new Error(
      `Unknown sequence: "${name}". Available: ${sequences.map((s) => s.name).join(", ")}`
    );
  }
  return seq;
}

/** List all available sequence names and descriptions */
export function listSequences(): { name: string; description: string; chains: string[] }[] {
  return sequences.map((s) => ({
    name: s.name,
    description: s.description,
    chains: s.chains,
  }));
}
