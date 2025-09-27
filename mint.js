import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Simple NFT minting function - just mint with 2500 limit
export async function mintSimpleNFT(playerAddress) {
  if (!window.ethereum) {
    alert("Please install MetaMask or another Web3 wallet!");
    return;
  }

  try {
    // Check if we're on Base chain
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== 8453n) {
      throw new Error("Please switch to Base chain to mint NFTs");
    }

    const signer = await provider.getSigner();
    
    // Contract configuration for mainnet
    const CONTRACT_ADDRESS = "0xB2e0357A94a555B5BB6A3dC0A5c90F18FFCBd778"; // Replace with your correct contract address
    const CONTRACT_ABI = [
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"}],"name":"NFTMinted","type":"event"},
      {"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"remainingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
    ];

    showGameMessage("⏳ Minting Simple NFT...");

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Check if player already has NFT
    const playerTokenId = await contract.playerTokenId(playerAddress);
    if (playerTokenId > 0) {
      throw new Error("You already have an NFT!");
    }
    
    // Check remaining supply
    const remainingSupply = await contract.remainingSupply();
    if (remainingSupply === 0n) {
      throw new Error("All 2500 NFTs have been minted!");
    }
    
    // Mint NFT
    const tx = await contract.mintNFT({ gasLimit: 300000 });
    await tx.wait();

    // Get the minted token ID
    const totalSupply = await contract.totalSupply();
    const mintedTokenId = Number(totalSupply);

    showGameMessage(`🎉 Simple NFT #${mintedTokenId} minted successfully!`);
    
    console.log("Simple NFT minted:", {
      player: playerAddress,
      tokenId: mintedTokenId,
      txHash: tx.hash,
      remaining: Number(remainingSupply) - 1
    });

    return {
      success: true,
      tokenId: mintedTokenId,
      txHash: tx.hash,
      remaining: Number(remainingSupply) - 1
    };

  } catch (err) {
    console.error("Simple NFT minting failed:", err);
    showGameMessage(`❌ Minting failed: ${err.message}`);
    throw err;
  }
}
