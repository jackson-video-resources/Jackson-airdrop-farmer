import "dotenv/config";
import { loadWallets, getPrivateKey, getMnemonic } from "./wallet-manager.js";
import { ethers } from "ethers";

const wallets = loadWallets();
const w0 = wallets[0];
const privateKey = getPrivateKey(w0);

// Recreate the wallet from the private key to prove it matches
const wallet = new ethers.Wallet(privateKey);

console.log("WALLET VERIFICATION");
console.log("===================");
console.log("Stored address:   ", w0.address);
console.log("From private key: ", wallet.address);
console.log("Addresses match:  ", w0.address === wallet.address);
console.log("");

// Also verify from mnemonic
const mnemonic = getMnemonic()!;
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
const child0 = hdNode.deriveChild(0);
console.log("From mnemonic:    ", child0.address);
console.log("Mnemonic matches: ", child0.address === w0.address);
console.log("");

// Check balance on mainnet
const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const balance = await provider.getBalance(w0.address);
console.log("Current ETH balance:", ethers.formatEther(balance), "ETH");
console.log("");

// Prove you can sign with this wallet
const message = "I control this wallet";
const signer = new ethers.Wallet(privateKey);
const signature = await signer.signMessage(message);
const recovered = ethers.verifyMessage(message, signature);
console.log("SIGNATURE PROOF");
console.log("Signed message:   ", message);
console.log("Recovered signer: ", recovered);
console.log("Signer matches:   ", recovered === w0.address);
console.log("");
console.log("Your mnemonic phrase (controls all 10 wallets):");
console.log(mnemonic);
console.log("");
console.log("You can import this mnemonic into MetaMask at any time to access your funds directly.");
