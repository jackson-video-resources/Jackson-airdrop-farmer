import { ethers } from "ethers";
import { getSigner } from "../chains/index.js";
import { executeTask } from "../tasks/executor.js";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";
import { validateTaskAddresses, preSimulate } from "./tx-simulator.js";
import { snapshotBalance, checkBalanceDrop, getTaskSendAmount } from "./balance-watchdog.js";
import { revokeAllowance, getSpenderForTask } from "./approval-guard.js";
import { sendAlert } from "./alerts.js";
import { isKnownAddress } from "./address-registry.js";
import type { Task, TaskResult } from "../tasks/types.js";

/**
 * Safe wrapper around executeTask.
 * Adds pre-checks, balance monitoring, approval cleanup, and alerting.
 */
export async function safeExecuteTask(
  privateKey: string,
  task: Task
): Promise<TaskResult> {
  const chain = task.type === "bridge_to_l2"
    ? "ethereum"
    : task.chain;
  const signer = getSigner(chain, privateKey);
  const address = await signer.getAddress();
  const amountWei = (task.params.amountWei as bigint) ?? 0n;

  // ── PRE-CHECK 1: Validate all addresses ──
  try {
    validateTaskAddresses(task);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendAlert(
      `Blocked task: ${task.type} on ${task.chain}\n${msg}`,
      "critical"
    );
    return {
      task,
      success: false,
      error: msg,
      timestamp: Date.now(),
    };
  }

  // ── PRE-CHECK 2: Balance snapshot ──
  let snapshot;
  try {
    snapshot = await snapshotBalance(chain, address);
  } catch {
    // RPC failure — proceed without balance monitoring
    snapshot = null;
  }

  // ── PRE-CHECK 3: Simulation (for high-risk task types) ──
  const sim = await preSimulate(chain, privateKey, task);
  if (!sim.shouldProceed) {
    const msg = `Simulation failed for ${task.type} on ${task.chain}: ${sim.reason}`;
    log.warn(`[SAFETY] ${msg}`);
    return {
      task,
      success: false,
      error: msg,
      timestamp: Date.now(),
    };
  }

  // ── EXECUTE ──
  const result = await executeTask(privateKey, task);

  // ── POST-CHECK 1: Balance watchdog ──
  if (snapshot && result.success) {
    try {
      const sendAmount = getTaskSendAmount(task.type, amountWei);
      const check = await checkBalanceDrop(snapshot, task.type, sendAmount);
      if (!check.ok) {
        // Alert already sent by checkBalanceDrop
        log.error(`[SAFETY] Suspicious balance drop after ${task.type}: ${formatEth(check.dropped)} ETH`);
      }
    } catch {
      // Balance check failed — not critical, continue
    }
  }

  // ── POST-CHECK 2: Revoke approvals after swaps ──
  if (result.success && task.type === "dex_swap") {
    try {
      const tokenInSymbol = (task.params.tokenIn as string) ?? "ETH";
      // Only revoke if we approved a non-ETH token
      if (tokenInSymbol.toUpperCase() !== "ETH") {
        const spender = getSpenderForTask(task.chain, task.protocol);
        if (spender) {
          const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
            base: { USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
            scroll: { USDC: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" },
            linea: { USDC: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" },
            zksync: { USDC: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4" },
          };
          const tokenAddr = TOKEN_ADDRESSES[task.chain]?.[tokenInSymbol.toUpperCase()];
          if (tokenAddr) {
            // Fire-and-forget — don't block on revocation
            revokeAllowance(signer, tokenAddr, spender).catch(() => {});
          }
        }
      }
    } catch {
      // Revocation is best-effort
    }
  }

  return result;
}

export { sendAlert, sendSessionSummary } from "./alerts.js";
export { scanAllowances, revokeAll } from "./approval-guard.js";
export { isKnownAddress, validateTarget, registerAddress, getAllAddresses } from "./address-registry.js";
export { snapshotBalance } from "./balance-watchdog.js";
