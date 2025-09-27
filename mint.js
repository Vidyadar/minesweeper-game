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
    // Check if we're on Base Sepolia testnet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== 84532n) { // Base Sepolia testnet
      throw new Error("Please switch to Base Sepolia testnet to mint NFTs");
    }

    const signer = await provider.getSigner();
    
    // Contract configuration for Base Sepolia testnet
    const CONTRACT_ADDRESS = "0xd3b388Bb651240EDF607dc2de674361c4bc150Eb"; // Your testnet contract address
    const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

    showGameMessage("⏳ Minting Simple NFT...");

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // First, check if contract is deployed and working
    try {
      const contractName = await contract.name();
      console.log("Contract name:", contractName);
    } catch (err) {
      throw new Error("Contract not found or not deployed at this address. Please check the contract address.");
    }
    
    // Check if player already has NFT (optional check)
    let playerTokenId = 0;
    try {
      playerTokenId = await contract.playerTokenId(playerAddress);
      console.log("Player token ID:", playerTokenId);
      if (playerTokenId > 0) {
        throw new Error("You already have an NFT!");
      }
    } catch (err) {
      if (err.message.includes("already have an NFT")) {
        throw err; // Re-throw the "already have NFT" error
      }
      console.log("Could not check player token ID, proceeding with mint...");
      // If we can't check, we'll let the contract handle the duplicate check
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
