import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";
import { getProvider } from "../chains/index.js";

// Zora 1155 Factory Proxy — same address on all chains
const FACTORY_ADDRESS = ethers.getAddress(
  "0x777777C338d93e2C7adf08D102d45CA7CC4Ed021"
);

// ZoraTimedSaleStrategy — same address on all chains
const TIMED_SALE_STRATEGY = ethers.getAddress(
  "0x777777722D078c97c6ad07d9f36801e653E356Ae"
);

// Mint price per token for timed sales (0.000111 ETH)
const MINT_PRICE = ethers.parseEther("0.000111");

const FACTORY_ABI = [
  "function createContract(string calldata newContractURI, string calldata name, (uint32 royaltyMintSchedule, uint32 royaltyBPS, address royaltyRecipient) defaultRoyaltyConfiguration, address payable defaultAdmin, bytes[] calldata setupActions) external returns (address)",
];

// The 1155 collection's mint function delegates to a minter strategy
const COLLECTION_MINT_ABI = [
  "function mint(address minter, uint256 tokenId, uint256 quantity, address[] calldata rewardsRecipients, bytes calldata minterArguments) external payable",
];

// ZoraTimedSaleStrategy has its own direct mint function
const TIMED_SALE_MINT_ABI = [
  "function mint(address mintTo, uint256 quantity, address collection, uint256 tokenId, address mintReferral, string calldata comment) external payable",
];

/**
 * Creates a new Zora 1155 collection via the factory contract.
 * Returns the tx hash and the deployed collection contract address.
 */
export async function createZoraCollection(
  signer: ethers.Wallet,
  chain: string
): Promise<{ txHash: string; contractAddress: string }> {
  const address = await signer.getAddress();

  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

  const contractURI = `ipfs://bafkreiempty`; // Minimal placeholder URI
  const name = `Collection ${Date.now()}`;
  const royaltyConfig = {
    royaltyMintSchedule: 0,
    royaltyBPS: 0,
    royaltyRecipient: ethers.ZeroAddress,
  };

  log.info(`Creating Zora 1155 collection on ${chain} from ${address.slice(0, 10)}...`);

  const tx = await factory.createContract(
    contractURI,
    name,
    royaltyConfig,
    address, // defaultAdmin = signer
    [] // no setupActions
  );
  const receipt = await tx.wait();

  // Parse the SetupNewContract event to get the new collection address
  const setupTopic = ethers.id(
    "SetupNewContract(address,address,address,string,string,(uint32,uint32,address))"
  );
  const setupLog = receipt.logs.find(
    (l: ethers.Log) => l.topics[0] === setupTopic
  );

  let contractAddress: string;
  if (setupLog) {
    // The new contract address is the first indexed param (topics[1])
    contractAddress = ethers.getAddress(
      ethers.dataSlice(setupLog.topics[1], 12)
    );
  } else {
    // Fallback: look for any contract creation in the logs
    const iface = new ethers.Interface(FACTORY_ABI);
    // The factory returns the new contract address, but we can't easily
    // get return values from a tx receipt. Try parsing all logs.
    const createdAddr = receipt.logs
      .map((l: ethers.Log) => {
        try {
          return ethers.getAddress(ethers.dataSlice(l.topics[1] ?? "0x", 12));
        } catch {
          return null;
        }
      })
      .find((a: string | null) => a && a !== ethers.ZeroAddress);
    contractAddress = createdAddr ?? "unknown";
  }

  log.tx(receipt.hash, `created Zora 1155 collection on ${chain}`);
  log.success(`Collection deployed: ${contractAddress}`);

  return { txHash: receipt.hash, contractAddress };
}

/**
 * Mints NFTs from an existing Zora 1155 collection using the ZoraTimedSaleStrategy.
 *
 * The timed sale strategy charges 0.000111 ETH per mint.
 * This calls the strategy's direct `mint` function which is the simplest path.
 */
export async function mintZoraNFT(
  signer: ethers.Wallet,
  chain: string,
  collectionAddress: string,
  tokenId: number,
  quantity: number
): Promise<string> {
  const address = await signer.getAddress();
  const mintValue = MINT_PRICE * BigInt(quantity);

  const timedSale = new ethers.Contract(
    TIMED_SALE_STRATEGY,
    TIMED_SALE_MINT_ABI,
    signer
  );

  log.info(
    `Minting ${quantity}x token #${tokenId} from ${collectionAddress.slice(0, 10)}... on ${chain} (cost: ${formatEth(mintValue)} ETH)`
  );

  const tx = await timedSale.mint(
    address, // mintTo
    quantity, // quantity
    collectionAddress, // collection
    tokenId, // tokenId
    ethers.ZeroAddress, // mintReferral (none)
    "", // comment
    { value: mintValue }
  );
  const receipt = await tx.wait();

  log.tx(receipt.hash, `minted ${quantity}x Zora NFT on ${chain}`);
  return receipt.hash;
}

/**
 * Mints via the collection's mint function directly, using a specific minter address.
 * This is an alternative path when the collection uses a different minting strategy.
 */
export async function mintZoraNFTViaCollection(
  signer: ethers.Wallet,
  chain: string,
  collectionAddress: string,
  minterAddress: string,
  tokenId: number,
  quantity: number,
  mintPricePerToken: bigint = MINT_PRICE
): Promise<string> {
  const address = await signer.getAddress();
  const mintValue = mintPricePerToken * BigInt(quantity);

  const collection = new ethers.Contract(
    collectionAddress,
    COLLECTION_MINT_ABI,
    signer
  );

  // minterArguments = abi.encode(address mintTo)
  const minterArguments = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [address]
  );

  log.info(
    `Minting ${quantity}x token #${tokenId} via collection ${collectionAddress.slice(0, 10)}... on ${chain} (cost: ${formatEth(mintValue)} ETH)`
  );

  const tx = await collection.mint(
    minterAddress, // minter strategy contract
    tokenId,
    quantity,
    [], // rewardsRecipients
    minterArguments,
    { value: mintValue }
  );
  const receipt = await tx.wait();

  log.tx(receipt.hash, `minted ${quantity}x Zora NFT on ${chain}`);
  return receipt.hash;
}
