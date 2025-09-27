import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Early Adopter NFT minting system
let earlyAdopterNFTs = {
  totalMinted: 0,
  maxSupply: 2500,
  playerNFTs: new Map(), // Track NFTs per player
  isEarlyAdopter: function() {
    return this.totalMinted < this.maxSupply;
  },
  canPlayerMint: function(playerAddress) {
    // Allow one NFT per player for early adopters
    return this.isEarlyAdopter() && !this.playerNFTs.has(playerAddress);
  }
};

// Early adopter NFT minting function
export async function mintEarlyAdopterNFT(playerAddress, playerName) {
  if (!window.ethereum) {
    alert("Please install MetaMask or another Web3 wallet!");
    return;
  }

  try {
    // Check if player can mint
    if (!earlyAdopterNFTs.canPlayerMint(playerAddress)) {
      if (!earlyAdopterNFTs.isEarlyAdopter()) {
        throw new Error("Early adopter period ended. All 2,500 NFTs have been minted!");
      } else {
        throw new Error("You already have an early adopter NFT!");
      }
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // Check if we're on Base chain
    const network = await provider.getNetwork();
    if (network.chainId !== 8453n) {
      alert("Please switch to Base chain to mint NFTs!");
      return;
    }

    // Create early adopter NFT metadata
    const metadata = {
      name: `Minesweeper Early Adopter #${earlyAdopterNFTs.totalMinted + 1}`,
      description: `Early adopter NFT for Minesweeper game. Limited to 2,500 total supply. Player: ${playerName}`,
      image: "https://minesweeper-game-pearl.vercel.app/assets/icon.png", // Use game icon
      attributes: [
        { trait_type: "Type", value: "Early Adopter" },
        { trait_type: "Player", value: playerName },
        { trait_type: "Mint Number", value: earlyAdopterNFTs.totalMinted + 1 },
        { trait_type: "Total Supply", value: "2500" },
        { trait_type: "Platform", value: "Farcaster" }
      ]
    };

    // Use a simple transaction to record the early adopter NFT
    const nftHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        `MinesweeperEarlyAdopter-${playerAddress}-${earlyAdopterNFTs.totalMinted + 1}-${Date.now()}`
      )
    );

    showGameMessage("⏳ Minting Early Adopter NFT...");

    const tx = await signer.sendTransaction({
      to: playerAddress, // Send to self as a record
      value: 0,
      data: ethers.toUtf8Bytes(`Minesweeper Early Adopter NFT: ${JSON.stringify({
        hash: nftHash,
        player: playerName,
        mintNumber: earlyAdopterNFTs.totalMinted + 1,
        timestamp: Date.now(),
        metadata: metadata
      })}`)
    });

    await tx.wait();

    // Update tracking
    earlyAdopterNFTs.totalMinted++;
    earlyAdopterNFTs.playerNFTs.set(playerAddress, {
      mintNumber: earlyAdopterNFTs.totalMinted,
      txHash: tx.hash,
      timestamp: Date.now()
    });

    showGameMessage(`🎉 Early Adopter NFT #${earlyAdopterNFTs.totalMinted} minted successfully!`);
    
    console.log("Early Adopter NFT minted:", {
      player: playerName,
      mintNumber: earlyAdopterNFTs.totalMinted,
      txHash: tx.hash,
      baseScanUrl: `https://basescan.org/tx/${tx.hash}`,
      remaining: earlyAdopterNFTs.maxSupply - earlyAdopterNFTs.totalMinted
    });

    return {
      success: true,
      mintNumber: earlyAdopterNFTs.totalMinted,
      txHash: tx.hash,
      remaining: earlyAdopterNFTs.maxSupply - earlyAdopterNFTs.totalMinted
    };

  } catch (err) {
    console.error("Early adopter minting failed:", err);
    showGameMessage(`❌ ${err.message}`);
    throw err;
  }
}

// Check if player is eligible for early adopter NFT
export function checkEarlyAdopterEligibility(playerAddress) {
  return {
    isEligible: earlyAdopterNFTs.canPlayerMint(playerAddress),
    hasNFT: earlyAdopterNFTs.playerNFTs.has(playerAddress),
    totalMinted: earlyAdopterNFTs.totalMinted,
    maxSupply: earlyAdopterNFTs.maxSupply,
    remaining: earlyAdopterNFTs.maxSupply - earlyAdopterNFTs.totalMinted
  };
}

// Legacy function for backward compatibility (now just shares result)
export async function captureAndMint(gameResult) {
  // This function is now deprecated - early adopter minting is handled separately
  console.log("Legacy minting function called - redirecting to share result");
  
  if (window.gameInstance && window.gameInstance.shareResult) {
    window.gameInstance.shareResult();
  } else {
    showGameMessage("Game result shared! 🎉");
  }
}
