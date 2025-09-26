// mint.js
import { NFTStorage, File } from 'https://cdn.jsdelivr.net/npm/nft.storage/dist/bundle.esm.min.js';

const NFT_STORAGE_KEY = "1144cc8a.332c392bfee740c9b6794dca1daf979a"; 
const CONTRACT_ADDRESS = "0xe998e76dA35333bCa55d5c8375E8E537Bfe7F819"; 
const CONTRACT_ABI = [
  "function mint(address to, string memory tokenURI) external returns (uint256)",
  "function nextTokenId() view returns (uint256)"
];

let provider, signer, nftContract, userAddress;

async function connectWallet() {
  if (!window.ethereum) throw new Error("Install MetaMask!");
  await window.ethereum.request({ method: "eth_requestAccounts" });
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  nftContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function captureAndMint(gameResult) {
  try {
    // capture minefield as image
    const el = document.getElementById("minefield");
    if (!el) throw new Error("Minefield not found");
    const canvas = await html2canvas(el);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));

    // upload metadata to nft.storage
    const client = new NFTStorage({ token: NFT_STORAGE_KEY });
    const metadata = await client.store({
      name: `Minesweeper - ${gameResult.difficulty}`,
      description: `${gameResult.win ? "Won" : "Lost"} in ${gameResult.time}s`,
      image: new File([blob], "result.png", { type: "image/png" }),
      properties: gameResult
    });

    const tokenURI = metadata.url;

    // connect wallet & mint
    if (!signer) await connectWallet();
    const tx = await nftContract.mint(userAddress, tokenURI);
    alert("Minting NFT... " + tx.hash);
    await tx.wait();
    alert("✅ NFT Minted! Metadata: " + tokenURI);
  } catch (err) {
    console.error(err);
    alert("❌ Mint failed: " + err.message);
  }
}

// expose to window so HTML can call it
window.captureAndMint = captureAndMint;

