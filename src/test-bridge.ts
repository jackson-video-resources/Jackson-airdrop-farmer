import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getProvider } from "./chains/index.js";

async function main() {
  const wallets = loadWallets();
  const w0 = wallets[0];
  const privateKey = getPrivateKey(w0);
  const provider = getProvider("ethereum");
  const signer = new ethers.Wallet(privateKey, provider);

  const portalAddress = ethers.getAddress("0x49048044d57e1c92a77f79988d21fa8faf74e97e");
  const amountWei = ethers.parseEther("0.002");
  const recipient = await signer.getAddress();

  console.log("Testing Base bridge...");
  console.log("Portal:", portalAddress);
  console.log("From:", recipient);
  console.log("Amount:", ethers.formatEther(amountWei), "ETH");

  // Check current ETH balance
  const balance = await provider.getBalance(recipient);
  console.log("Current balance:", ethers.formatEther(balance), "ETH");

  // Verify the portal is actually a contract
  const code = await provider.getCode(portalAddress);
  console.log("Portal code size:", code.length, "bytes", code === "0x" ? "(NOT A CONTRACT!)" : "(is a contract)");

  if (code === "0x") {
    console.error("ERROR: Portal address is not a contract!");
    return;
  }

  const portal = new ethers.Contract(
    portalAddress,
    ["function depositTransaction(address _to, uint256 _value, uint64 _gasLimit, bool _isCreation, bytes _data) payable"],
    signer
  );

  console.log("Sending depositTransaction...");
  try {
    const tx = await portal.depositTransaction(
      recipient,
      amountWei,
      100000,
      false,
      "0x",
      { value: amountWei }
    );
    console.log("TX sent:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Confirmed! Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
  } catch (err: any) {
    console.error("Bridge failed:", err.message);
    if (err.info) console.error("Info:", JSON.stringify(err.info, null, 2));
  }
}

main().catch(console.error);
