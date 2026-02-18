import { ethers } from "ethers";
import { log } from "../utils/logger.js";

// Minimal bytecode: stores msg.sender at slot 0, returns 1 byte of runtime code
// CALLER PUSH0 SSTORE PUSH1 0x01 PUSH0 RETURN
const MINIMAL_BYTECODE = "0x3360005560016000f3";

export async function deployMinimalContract(
  signer: ethers.Wallet
): Promise<{ txHash: string; contractAddress: string }> {
  const address = await signer.getAddress();
  log.info(`Deploying minimal contract from ${address.slice(0, 10)}...`);

  const tx = await signer.sendTransaction({
    data: MINIMAL_BYTECODE,
  });
  const receipt = await tx.wait();

  const txHash = receipt!.hash;
  const contractAddress = receipt!.contractAddress!;

  log.tx(txHash, `deployed contract at ${contractAddress}`);
  log.success(`Contract deployed: ${contractAddress}`);

  return { txHash, contractAddress };
}
