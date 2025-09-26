import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Replace with your contract address and ABI
const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
const contractABI = [
  // Minimal ABI for minting
  "function mintResultNFT(string memory metadataURI) public returns (uint256)"
];

const contract = new ethers.Contract(contractAddress, contractABI, signer);

// Helper to show messages in Minesweeper UI if available
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Function to mint NFT
export async function mintGameResult(metadataURI) {
  try {
    showGameMessage("⏳ Minting NFT...");

    const tx = await contract.mintResultNFT(metadataURI);
    showGameMessage("🟢 Transaction sent! Waiting for confirmation...\nTx: " + tx.hash);

    await tx.wait();

    showGameMessage("✅ NFT Minted Successfully!\nMetadata URI: " + metadataURI);
  } catch (err) {
    console.error(err);
    showGameMessage("❌ NFT Minting Failed: " + (err.message || err));
  }
}
