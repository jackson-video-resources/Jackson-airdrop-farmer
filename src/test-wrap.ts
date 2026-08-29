import "dotenv/config";
import { ethers } from "ethers";

const { loadWallets, getPrivateKey } = await import("./wallet-manager.js");
const { getProvider } = await import("./chains/index.js");
const { wrapEth, unwrapEth } = await import("./protocols/weth.js");

const provider = getProvider("unichain");
const w01 = loadWallets()[1];
const signer = new ethers.Wallet(getPrivateKey(w01), provider);

const WETH = "0x4200000000000000000000000000000000000006";
const weth = new ethers.Contract(
  WETH,
  ["function balanceOf(address) view returns (uint256)"],
  provider,
);

const amount = ethers.parseEther("0.0005");

console.log(`W01 ${w01.address}`);
console.log(`ETH  before: ${ethers.formatEther(await provider.getBalance(w01.address))}`);
console.log(`WETH before: ${ethers.formatEther(await weth.balanceOf(w01.address))}`);
console.log(`nonce: ${await provider.getTransactionCount(w01.address, "pending")}\n`);

console.log(`--- wrapping ${ethers.formatEther(amount)} ETH ---`);
await wrapEth(signer, "unichain", amount);

console.log(`\nETH  after wrap: ${ethers.formatEther(await provider.getBalance(w01.address))}`);
console.log(`WETH after wrap: ${ethers.formatEther(await weth.balanceOf(w01.address))}`);

console.log(`\n--- unwrapping back ---`);
await unwrapEth(signer, "unichain", amount);

console.log(`\nETH  final: ${ethers.formatEther(await provider.getBalance(w01.address))}`);
console.log(`WETH final: ${ethers.formatEther(await weth.balanceOf(w01.address))}`);
process.exit(0);
