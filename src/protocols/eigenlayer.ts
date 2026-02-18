import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

// EigenLayer core contracts (Ethereum mainnet)
const STRATEGY_MANAGER = ethers.getAddress("0x858646372CC42E1A627fcE94aa7A7033e7CF075A");
const DELEGATION_MANAGER = ethers.getAddress("0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A");

// stETH strategy — the primary LST restaking path on EigenLayer
// (no standalone WETH strategy exists in the official deployment)
const STETH_STRATEGY = ethers.getAddress("0x93c4b944D05dfe6df7645A86cd2206016c51564D");

// Lido stETH token (used to convert ETH → stETH before depositing)
const STETH_TOKEN = ethers.getAddress("0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");

const STRATEGY_MANAGER_ABI = [
  "function depositIntoStrategy(address strategy, address token, uint256 amount) returns (uint256 shares)",
];

const DELEGATION_MANAGER_ABI = [
  "function queueWithdrawals(tuple(address[] strategies, uint256[] shares, address withdrawer)[] queuedWithdrawalParams) returns (bytes32[])",
];

const STETH_ABI = [
  "function submit(address referral) payable returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

/** Convert ETH → stETH via Lido, then deposit into EigenLayer stETH strategy */
export async function eigenDeposit(
  signer: ethers.Wallet,
  amountWei: bigint
): Promise<string> {
  const address = await signer.getAddress();
  const steth = new ethers.Contract(STETH_TOKEN, STETH_ABI, signer);

  // Step 1: Convert ETH → stETH via Lido
  log.info(`Converting ${formatEth(amountWei)} ETH → stETH via Lido`);
  const submitTx = await steth.submit(ethers.ZeroAddress, { value: amountWei });
  const submitReceipt = await submitTx.wait();
  log.tx(submitReceipt.hash, "ETH → stETH via Lido");

  // Step 2: Check stETH balance (may differ slightly due to rounding)
  const stethBalance: bigint = await steth.balanceOf(address);
  const depositAmount = stethBalance < amountWei ? stethBalance : amountWei;

  // Step 3: Approve StrategyManager to spend stETH
  const allowance: bigint = await steth.allowance(address, STRATEGY_MANAGER);
  if (allowance < depositAmount) {
    log.info("Approving stETH for EigenLayer StrategyManager");
    const approveTx = await steth.approve(STRATEGY_MANAGER, depositAmount);
    await approveTx.wait();
    log.success("stETH approval confirmed");
  }

  // Step 4: Deposit into EigenLayer stETH strategy
  const strategyManager = new ethers.Contract(STRATEGY_MANAGER, STRATEGY_MANAGER_ABI, signer);
  log.info(`Depositing ${formatEth(depositAmount)} stETH into EigenLayer`);
  const tx = await strategyManager.depositIntoStrategy(STETH_STRATEGY, STETH_TOKEN, depositAmount);
  const receipt = await tx.wait();

  log.tx(receipt.hash, "EigenLayer stETH deposit");
  return receipt.hash;
}

/** Queue a withdrawal from the EigenLayer stETH strategy */
export async function eigenQueueWithdrawal(
  signer: ethers.Wallet,
  shares: bigint
): Promise<string> {
  const address = await signer.getAddress();
  const delegationManager = new ethers.Contract(DELEGATION_MANAGER, DELEGATION_MANAGER_ABI, signer);

  const withdrawalParams = [
    {
      strategies: [STETH_STRATEGY],
      shares: [shares],
      withdrawer: address,
    },
  ];

  log.info(`Queueing EigenLayer withdrawal for ${formatEth(shares)} shares`);
  const tx = await delegationManager.queueWithdrawals(withdrawalParams);
  const receipt = await tx.wait();

  log.tx(receipt.hash, "EigenLayer queue withdrawal");
  return receipt.hash;
}
