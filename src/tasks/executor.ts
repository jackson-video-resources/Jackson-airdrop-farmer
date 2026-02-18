import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "../wallet-manager.js";
import { getSigner, getProvider } from "../chains/index.js";
import { wrapEth, unwrapEth, WETH_ADDRESSES } from "../protocols/weth.js";
import { swapExactInput, BASE_TOKENS } from "../protocols/uniswap-v3.js";
import { swapSyncSwap } from "../protocols/syncswap.js";
import { swapAmbient } from "../protocols/ambient.js";
import { swapVelodrome } from "../protocols/velodrome.js";
import { bridgeToL2 } from "../protocols/bridge-official.js";
import { bridgeOrbiter } from "../protocols/orbiter-bridge.js";
import { bridgeStargate } from "../protocols/stargate.js";
import { deployMinimalContract } from "../protocols/deploy-contract.js";
import { supplyETH, withdrawETH } from "../protocols/aave-v3.js";
import { createZoraCollection, mintZoraNFT } from "../protocols/zora-mint.js";
import { eigenDeposit, eigenQueueWithdrawal } from "../protocols/eigenlayer.js";
import { pendleSwapForPT, pendleSwapPTForToken, getPTBalance, PENDLE_MARKETS } from "../protocols/pendle.js";
import { generatePersonality, shouldBeActive, getDelay } from "./personality.js";
import { getSequence } from "./sequences.js";
import { randomSleep, jitterAmount, shuffle, describeDelay } from "../utils/random.js";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";
import { logTaskCost } from "../cost-logger.js";
import type { Task, TaskResult, FarmingSession } from "./types.js";

/** Default amount in wei (0.001 ETH) */
const DEFAULT_AMOUNT = ethers.parseEther("0.001");

/** Wait for bridged ETH to arrive on L2 (polls balance every 30s, up to 10 min) */
async function waitForBridgeArrival(
  chain: string,
  address: string,
  maxWaitMs: number = 600_000
): Promise<void> {
  const provider = getProvider(chain);
  const startBalance = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;

  log.info(`Waiting for bridge deposit to arrive on ${chain} (current balance: ${formatEth(startBalance)} ETH)...`);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 30_000)); // poll every 30s
    const balance = await provider.getBalance(address);
    if (balance > startBalance) {
      log.success(`Bridge deposit arrived on ${chain}! New balance: ${formatEth(balance)} ETH`);
      return;
    }
    log.info(`Still waiting for bridge... (${Math.round((deadline - Date.now()) / 1000)}s remaining)`);
  }

  log.warn(`Bridge deposit did not arrive within ${maxWaitMs / 1000}s. Proceeding anyway.`);
}

/** Token address lookup per chain */
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  base: {
    ETH: ethers.getAddress("0x4200000000000000000000000000000000000006"),
    USDC: ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"),
  },
  scroll: {
    ETH: ethers.getAddress("0x5300000000000000000000000000000000000004"),
    USDC: ethers.getAddress("0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4"),
  },
  linea: {
    ETH: ethers.getAddress("0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f"),
    USDC: ethers.getAddress("0x176211869ca2b568f2a7d4ee941e073a821ee1ff"),
  },
  zksync: {
    ETH: ethers.getAddress("0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"),
    USDC: ethers.getAddress("0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4"),
  },
  arbitrum: {
    ETH: ethers.getAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
    USDC: ethers.getAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
  },
  optimism: {
    ETH: ethers.getAddress("0x4200000000000000000000000000000000000006"),
    USDC: ethers.getAddress("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"),
  },
};

function resolveToken(chain: string, symbol: string): string {
  const tokens = TOKEN_ADDRESSES[chain.toLowerCase()];
  if (!tokens) throw new Error(`No token map for chain: ${chain}`);
  const addr = tokens[symbol.toUpperCase()];
  if (!addr) throw new Error(`Unknown token ${symbol} on ${chain}`);
  return addr;
}

/** Execute a single task and return the result */
export async function executeTask(
  privateKey: string,
  task: Task
): Promise<TaskResult> {
  const startTime = Date.now();
  try {
    let txHash: string;

    switch (task.type) {
      case "wrap_eth": {
        const signer = getSigner(task.chain, privateKey);
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await wrapEth(signer, task.chain, amount);
        break;
      }

      case "unwrap_eth": {
        const signer = getSigner(task.chain, privateKey);
        let amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        // Check actual WETH balance to avoid "burn amount exceeds balance"
        const wethAddr = WETH_ADDRESSES[task.chain.toLowerCase()];
        if (wethAddr) {
          const wethToken = new ethers.Contract(wethAddr, [
            "function balanceOf(address) view returns (uint256)",
          ], signer);
          const wethBal: bigint = await wethToken.balanceOf(await signer.getAddress());
          if (wethBal === 0n) {
            throw new Error(`No WETH balance to unwrap on ${task.chain}`);
          }
          if (wethBal < amount) {
            amount = wethBal;
            log.info(`Adjusting unwrap amount to actual WETH balance: ${formatEth(amount)}`);
          }
        }
        txHash = await unwrapEth(signer, task.chain, amount);
        break;
      }

      case "dex_swap": {
        const chain = task.chain;
        const protocol = task.protocol ?? "uniswap-v3";
        const tokenInSymbol = (task.params.tokenIn as string) ?? "ETH";
        const tokenOutSymbol = (task.params.tokenOut as string) ?? "USDC";
        const tokenIn = resolveToken(chain, tokenInSymbol);
        const tokenOut = resolveToken(chain, tokenOutSymbol);
        let amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        const signer = getSigner(chain, privateKey);

        // For non-ETH tokenIn (e.g. USDC → ETH), use actual token balance
        // The ETH-denominated amount is wrong for tokens with different decimals
        if (tokenInSymbol.toUpperCase() !== "ETH") {
          const erc20 = new ethers.Contract(tokenIn, [
            "function balanceOf(address) view returns (uint256)",
          ], signer);
          const balance: bigint = await erc20.balanceOf(await signer.getAddress());
          if (balance === 0n) {
            throw new Error(`No ${tokenInSymbol} balance to swap on ${chain}`);
          }
          amount = balance; // swap entire balance back
          log.info(`Using actual ${tokenInSymbol} balance: ${balance}`);
        }

        if (protocol === "uniswap-v3") {
          txHash = await swapExactInput(signer, tokenIn, tokenOut, amount);
        } else if (protocol === "ambient") {
          txHash = await swapAmbient(signer, chain, tokenIn, tokenOut, amount);
        } else if (protocol === "velodrome" || protocol === "aerodrome") {
          txHash = await swapVelodrome(signer, chain, tokenIn, tokenOut, amount);
        } else {
          txHash = await swapSyncSwap(signer, chain, tokenIn, tokenOut, amount);
        }
        break;
      }

      case "bridge_to_l2": {
        const targetChain = (task.params.targetChain as string) ?? task.chain;
        const signer = getSigner("ethereum", privateKey);
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await bridgeToL2(signer, targetChain, amount);
        // Wait for the bridged ETH to arrive on L2 before continuing
        const walletAddress = await signer.getAddress();
        await waitForBridgeArrival(targetChain, walletAddress);
        break;
      }

      case "deploy_contract": {
        const signer = getSigner(task.chain, privateKey);
        const result = await deployMinimalContract(signer);
        txHash = result.txHash;
        break;
      }

      case "transfer_eth": {
        const signer = getSigner(task.chain, privateKey);
        const to = task.params.to as string;
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        const tx = await signer.sendTransaction({ to, value: amount });
        const receipt = await tx.wait();
        txHash = receipt!.hash;
        log.tx(txHash, `transfer ${formatEth(amount)} ETH → ${to.slice(0, 10)}... on ${task.chain}`);
        break;
      }

      case "bridge_orbiter": {
        const signer = getSigner(task.chain, privateKey);
        const toChain = task.params.toChain as string;
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await bridgeOrbiter(signer, task.chain, toChain, amount);
        break;
      }

      case "bridge_stargate": {
        const signer = getSigner(task.chain, privateKey);
        const toChain = task.params.toChain as string;
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await bridgeStargate(signer, task.chain, toChain, amount);
        break;
      }

      case "aave_supply": {
        const signer = getSigner(task.chain, privateKey);
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await supplyETH(signer, task.chain, amount);
        break;
      }

      case "aave_withdraw": {
        const signer = getSigner(task.chain, privateKey);
        const amount = (task.params.amountWei as bigint) ?? ethers.MaxUint256;
        txHash = await withdrawETH(signer, task.chain, amount);
        break;
      }

      case "create_nft_collection": {
        const signer = getSigner(task.chain, privateKey);
        const result = await createZoraCollection(signer, task.chain);
        txHash = result.txHash;
        break;
      }

      case "mint_nft": {
        const signer = getSigner(task.chain, privateKey);
        const collection = task.params.collection as string;
        const tokenId = (task.params.tokenId as number) ?? 1;
        const quantity = (task.params.quantity as number) ?? 1;
        txHash = await mintZoraNFT(signer, task.chain, collection, tokenId, quantity);
        break;
      }

      case "eigen_deposit": {
        const signer = getSigner("ethereum", privateKey);
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await eigenDeposit(signer, amount);
        break;
      }

      case "eigen_withdraw": {
        const signer = getSigner("ethereum", privateKey);
        const shares = (task.params.shares as bigint) ?? DEFAULT_AMOUNT;
        txHash = await eigenQueueWithdrawal(signer, shares);
        break;
      }

      case "pendle_buy_pt": {
        const signer = getSigner(task.chain, privateKey);
        const market = task.params.market as string;
        const amount = (task.params.amountWei as bigint) ?? DEFAULT_AMOUNT;
        txHash = await pendleSwapForPT(signer, task.chain, market, ethers.ZeroAddress, amount);
        break;
      }

      case "pendle_sell_pt": {
        const signer = getSigner(task.chain, privateKey);
        const market = task.params.market as string;
        const ptBalance = await getPTBalance(getProvider(task.chain), market, await getSigner(task.chain, privateKey).getAddress());
        if (ptBalance === 0n) throw new Error("No PT balance to sell");
        txHash = await pendleSwapPTForToken(signer, task.chain, market, ethers.ZeroAddress, ptBalance);
        break;
      }

      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }

    // Log gas cost to dashboard (fire-and-forget, don't block on errors)
    const taskChain = (task.type === "bridge_to_l2" || task.type === "eigen_deposit" || task.type === "eigen_withdraw") ? "ethereum" : task.chain;
    logTaskCost(
      taskChain,
      txHash,
      task.type,
      undefined,
      task.description
    ).catch(() => {});

    return {
      task,
      success: true,
      txHash,
      timestamp: Date.now(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Task failed [${task.type} on ${task.chain}]: ${message}`);
    return {
      task,
      success: false,
      error: message,
      timestamp: Date.now(),
    };
  }
}

/** Run a full session of tasks for a single wallet */
export async function runSession(session: FarmingSession): Promise<TaskResult[]> {
  const wallets = loadWallets();
  const wallet = wallets.find((w) => w.index === session.walletIndex);
  if (!wallet) throw new Error(`Wallet #${session.walletIndex} not found`);

  const privateKey = getPrivateKey(wallet);

  // Check if this wallet should be active right now
  if (!shouldBeActive(session.personality)) {
    log.wallet(
      session.walletIndex,
      wallet.label,
      `sleeping (active hours: ${session.personality.activeHoursStart}:00–${session.personality.activeHoursEnd}:00 UTC)`
    );
    return [];
  }

  log.wallet(session.walletIndex, wallet.label, `starting session (${session.tasks.length} tasks)`);
  log.divider();

  const results: TaskResult[] = [];

  for (let i = 0; i < session.tasks.length; i++) {
    const task = session.tasks[i];
    log.info(`Task ${i + 1}/${session.tasks.length}: ${task.description}`);

    const result = await executeTask(privateKey, task);
    results.push(result);

    if (result.success) {
      log.success(`Task ${i + 1}/${session.tasks.length} completed ${result.txHash ? `(${result.txHash.slice(0, 14)}...)` : ""}`);
    } else {
      log.error(`Task ${i + 1}/${session.tasks.length} failed: ${result.error}`);
    }

    // Delay between tasks (skip after the last one)
    if (i < session.tasks.length - 1) {
      const delay = getDelay(session.personality, session.minDelayMs, session.maxDelayMs);
      log.info(`Waiting ${describeDelay(delay)} before next task...`);
      await randomSleep(delay, delay);
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  log.wallet(
    session.walletIndex,
    wallet.label,
    `session done: ${succeeded}/${results.length} tasks succeeded`
  );
  log.divider();

  return results;
}

/** Run a sequence across the entire wallet fleet */
export async function runFleetFarming(
  sequenceName: string,
  options?: { walletIndices?: number[]; amountEth?: number }
): Promise<void> {
  const allWallets = loadWallets();
  if (allWallets.length === 0) {
    log.warn("No wallets found. Generate a fleet first.");
    return;
  }

  const sequence = getSequence(sequenceName);
  const amountWei = ethers.parseEther(String(options?.amountEth ?? 0.001));

  // Filter wallets if indices specified
  const wallets = options?.walletIndices
    ? allWallets.filter((w) => options.walletIndices!.includes(w.index))
    : allWallets;

  // Shuffle wallet order for randomization
  const shuffledWallets = shuffle(wallets);

  log.info(`Fleet farming: "${sequence.name}" across ${shuffledWallets.length} wallets`);
  log.info(`Amount per task: ~${formatEth(amountWei)} ETH`);
  log.divider();

  const allResults: { walletIndex: number; results: TaskResult[] }[] = [];

  for (let w = 0; w < shuffledWallets.length; w++) {
    const wallet = shuffledWallets[w];
    const personality = generatePersonality(wallet.index);

    // Build tasks from the sequence template, applying amount jitter
    const tasks: Task[] = sequence.tasks.map((t, i) => ({
      ...t,
      description: `${t.type}${t.protocol ? ` (${t.protocol})` : ""} on ${t.chain}`,
      params: {
        ...t.params,
        amountWei: jitterAmount(amountWei, personality.amountJitter),
      },
    }));

    const session: FarmingSession = {
      walletIndex: wallet.index,
      tasks,
      personality,
      minDelayMs: 30_000,   // 30 seconds minimum between tasks
      maxDelayMs: 300_000,  // 5 minutes maximum between tasks
    };

    const results = await runSession(session);
    allResults.push({ walletIndex: wallet.index, results });

    // Long delay between wallets (skip after the last one)
    if (w < shuffledWallets.length - 1) {
      const walletDelay = getDelay(personality, 30 * 60_000, 4 * 60 * 60_000); // 30 min – 4 hours
      log.info(`Waiting ${describeDelay(walletDelay)} before next wallet...`);
      await randomSleep(walletDelay, walletDelay);
    }
  }

  // Final summary
  log.divider();
  log.info("Fleet farming complete:");
  let totalTasks = 0;
  let totalSuccess = 0;
  for (const { walletIndex, results } of allResults) {
    const succeeded = results.filter((r) => r.success).length;
    totalTasks += results.length;
    totalSuccess += succeeded;
    log.wallet(walletIndex, `wallet-${walletIndex}`, `${succeeded}/${results.length} tasks`);
  }
  log.success(`Total: ${totalSuccess}/${totalTasks} tasks succeeded across ${allResults.length} wallets`);
  log.divider();
}
