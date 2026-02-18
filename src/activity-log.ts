import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { TaskResult } from "./tasks/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.resolve(__dirname, "../data/activity-log.json");

interface ActivityEntry {
  walletAddress: string;
  task: TaskResult["task"];
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string; // stored as string since bigint can't be JSON serialized
  timestamp: number;
}

function ensureDir(): void {
  const dir = path.dirname(LOG_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readLog(): ActivityEntry[] {
  if (!existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLog(entries: ActivityEntry[]): void {
  ensureDir();
  writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
}

export function logActivity(walletAddress: string, result: TaskResult): void {
  const entries = readLog();
  entries.push({
    walletAddress,
    task: result.task,
    success: result.success,
    txHash: result.txHash,
    error: result.error,
    gasUsed: result.gasUsed?.toString(),
    timestamp: Date.now(),
  });
  writeLog(entries);
}

export function getActivityLog(): ActivityEntry[] {
  return readLog();
}

export function getWalletActivity(address: string): ActivityEntry[] {
  return readLog().filter((e) => e.walletAddress.toLowerCase() === address.toLowerCase());
}

export function getActivitySummary(): {
  totalTxs: number;
  successRate: number;
  gasSpent: string;
  byChain: Record<string, number>;
  byProtocol: Record<string, number>;
} {
  const entries = readLog();
  const successful = entries.filter((e) => e.success).length;
  let gasSpent = 0n;
  const byChain: Record<string, number> = {};
  const byProtocol: Record<string, number> = {};

  for (const entry of entries) {
    if (entry.gasUsed) {
      gasSpent += BigInt(entry.gasUsed);
    }
    const chain = entry.task.chain;
    byChain[chain] = (byChain[chain] || 0) + 1;

    const protocol = entry.task.protocol || "native";
    byProtocol[protocol] = (byProtocol[protocol] || 0) + 1;
  }

  return {
    totalTxs: entries.length,
    successRate: entries.length > 0 ? successful / entries.length : 0,
    gasSpent: gasSpent.toString(),
    byChain,
    byProtocol,
  };
}
