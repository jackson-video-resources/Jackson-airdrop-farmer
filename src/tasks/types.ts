export type TaskType =
  | "bridge_to_l2"
  | "bridge_from_l2"
  | "bridge_orbiter"
  | "bridge_stargate"
  | "dex_swap"
  | "provide_liquidity"
  | "remove_liquidity"
  | "wrap_eth"
  | "unwrap_eth"
  | "transfer_eth"
  | "deploy_contract"
  | "mint_nft"
  | "create_nft_collection"
  | "aave_supply"
  | "aave_withdraw"
  | "eigen_deposit"
  | "eigen_withdraw"
  | "pendle_buy_pt"
  | "pendle_sell_pt";

export interface Task {
  type: TaskType;
  chain: string;
  protocol?: string;
  params: Record<string, unknown>;
  /** Human-readable description */
  description: string;
}

export interface TaskResult {
  task: Task;
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  timestamp: number;
}

export interface WalletPersonality {
  /** Delay multiplier (0.5 = faster, 2.0 = slower) */
  speedFactor: number;
  /** Preferred chains (weighted) */
  preferredChains: string[];
  /** Amount variance (how much to jitter tx amounts) */
  amountJitter: number;
  /** Preferred time-of-day window (UTC hours) */
  activeHoursStart: number;
  activeHoursEnd: number;
}

export interface FarmingSession {
  walletIndex: number;
  tasks: Task[];
  personality: WalletPersonality;
  /** Minimum delay between tasks in ms */
  minDelayMs: number;
  /** Maximum delay between tasks in ms */
  maxDelayMs: number;
}

/** Predefined task sequence templates */
export interface TaskSequence {
  name: string;
  description: string;
  chains: string[];
  tasks: Omit<Task, "description">[];
}
