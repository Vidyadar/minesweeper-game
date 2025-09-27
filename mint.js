import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Early Adopter NFT minting system with player statistics
let earlyAdopterNFTs = {
  totalMinted: 0,
  maxSupply: 2500,
  playerNFTs: new Map(), // Track NFTs per player
  playerStats: new Map(), // Track detailed player statistics
  isEarlyAdopter: function() {
    return this.totalMinted < this.maxSupply;
  },
  canPlayerMint: function(playerAddress) {
    // Allow one NFT per player for early adopters
    return this.isEarlyAdopter() && !this.playerNFTs.has(playerAddress);
  },
  // Initialize or get player stats
  getPlayerStats: function(playerAddress) {
    if (!this.playerStats.has(playerAddress)) {
      this.playerStats.set(playerAddress, {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRatio: 0,
        bestTime: null,
        totalPlayTime: 0,
        difficultyStats: {
          easy: { games: 0, wins: 0 },
          medium: { games: 0, wins: 0 },
          hard: { games: 0, wins: 0 }
        }
      });
    }
    return this.playerStats.get(playerAddress);
  },
  // Update player stats after game completion
  updatePlayerStats: function(playerAddress, gameResult) {
    const stats = this.getPlayerStats(playerAddress);
    stats.gamesPlayed++;
    
    if (gameResult.win) {
      stats.wins++;
      if (!stats.bestTime || gameResult.time < stats.bestTime) {
        stats.bestTime = gameResult.time;
      }
    } else {
      stats.losses++;
    }
    
    stats.totalPlayTime += gameResult.time;
    stats.winRatio = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed * 100).toFixed(1) : 0;
    
    // Update difficulty stats
    if (stats.difficultyStats[gameResult.difficulty]) {
      stats.difficultyStats[gameResult.difficulty].games++;
      if (gameResult.win) {
        stats.difficultyStats[gameResult.difficulty].wins++;
      }
    }
    
    this.playerStats.set(playerAddress, stats);
    return stats;
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

    // Get player statistics
    const playerStats = earlyAdopterNFTs.getPlayerStats(playerAddress);
    const mintPosition = earlyAdopterNFTs.totalMinted + 1;
    
    // Create early adopter NFT metadata with comprehensive stats
    const metadata = {
      name: `Minesweeper Early Adopter #${mintPosition}`,
      description: `Early adopter NFT #${mintPosition} for Minesweeper game. Player: ${playerName}. Games: ${playerStats.gamesPlayed}, Wins: ${playerStats.wins}, Win Rate: ${playerStats.winRatio}%`,
      image: "https://minesweeper-game-pearl.vercel.app/assets/icon.png", // Use game icon
      attributes: [
        { trait_type: "Type", value: "Early Adopter" },
        { trait_type: "Player", value: playerName },
        { trait_type: "Mint Position", value: mintPosition },
        { trait_type: "Total Supply", value: "2500" },
        { trait_type: "Games Played", value: playerStats.gamesPlayed },
        { trait_type: "Wins", value: playerStats.wins },
        { trait_type: "Losses", value: playerStats.losses },
        { trait_type: "Win Ratio", value: `${playerStats.winRatio}%` },
        { trait_type: "Best Time", value: playerStats.bestTime ? `${playerStats.bestTime}s` : "N/A" },
        { trait_type: "Total Play Time", value: `${playerStats.totalPlayTime}s` },
        { trait_type: "Easy Games", value: playerStats.difficultyStats.easy.games },
        { trait_type: "Medium Games", value: playerStats.difficultyStats.medium.games },
        { trait_type: "Hard Games", value: playerStats.difficultyStats.hard.games },
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
        mintPosition: mintPosition,
        timestamp: Date.now(),
        playerStats: playerStats,
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

    showGameMessage(`🎉 Early Adopter NFT #${mintPosition} minted successfully!`);
    
    console.log("Early Adopter NFT minted:", {
      player: playerName,
      mintPosition: mintPosition,
      playerStats: playerStats,
      txHash: tx.hash,
      baseScanUrl: `https://basescan.org/tx/${tx.hash}`,
      remaining: earlyAdopterNFTs.maxSupply - earlyAdopterNFTs.totalMinted
    });

    return {
      success: true,
      mintPosition: mintPosition,
      playerStats: playerStats,
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
