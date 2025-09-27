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

// Early adopter NFT minting function (now uses mintGameResult)
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

    // Contract configuration for mainnet
    const CONTRACT_ADDRESS = "0xe8e3F4639C848F169aEB8F68108Fb6c409DDd7d4"; // Mainnet contract address
    const CONTRACT_ABI = [
      {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"string","name":"difficulty","type":"string"},{"indexed":false,"internalType":"uint256","name":"time","type":"uint256"},{"indexed":false,"internalType":"bool","name":"win","type":"bool"},{"indexed":false,"internalType":"string","name":"playerName","type":"string"}],"name":"GameResultMinted","type":"event"},
      {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
      {"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"gameResults","outputs":[{"internalType":"string","name":"difficulty","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getGameResult","outputs":[{"components":[{"internalType":"string","name":"difficulty","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"internalType":"struct MinesweeperNFT.GameResult","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"string","name":"difficulty","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"name":"mintGameResult","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
      {"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
      {"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
      {"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}
    ];

    showGameMessage("⏳ Minting Early Adopter NFT...");

    // Generate status card image
    const imageDataUrl = await generateStatusCardImage(playerStats, playerName, mintPosition);
    
    // Prepare contract data
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
    // Convert player stats to contract format
    const contractStats = {
      gamesPlayed: playerStats.gamesPlayed,
      wins: playerStats.wins,
      losses: playerStats.losses,
      winRatio: Math.round(playerStats.winRatio * 100), // Convert to basis points
      bestTime: playerStats.bestTime || 0,
      totalPlayTime: playerStats.totalPlayTime
    };

    // Mint NFT with game result data
      const tx = await contract.mintGameResult(
      "Early Adopter", // difficulty
      playerStats.totalPlayTime || 0, // time
      playerStats.wins > 0, // win (true if player has any wins)
      playerName,
      imageDataUrl, // imageHash (Base64 encoded image)
      { gasLimit: 1000000 } // Higher gas limit for image storage
      );
      
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

// Generate status card image for contract storage
async function generateStatusCardImage(playerStats, playerName, mintPosition) {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 800;
  canvas.height = 600;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);
  
  // Add overlay for better text readability
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, 800, 600);
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎮 Minesweeper Player Status', 400, 60);
  
  // Player info
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`👤 ${playerName}`, 400, 100);
  
  // NFT status
  ctx.fillStyle = '#ffc107';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`⭐ Early Adopter NFT #${mintPosition}`, 400, 130);
  
  // Stats section
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('📊 Game Statistics', 50, 180);
  
  // Stats grid
  const stats = [
    { label: 'Games Played', value: playerStats.gamesPlayed },
    { label: 'Wins', value: playerStats.wins },
    { label: 'Losses', value: playerStats.losses },
    { label: 'Win Rate', value: `${playerStats.winRatio}%` },
    { label: 'Best Time', value: playerStats.bestTime ? `${playerStats.bestTime}s` : 'N/A' },
    { label: 'Total Play Time', value: `${playerStats.totalPlayTime}s` }
  ];
  
  ctx.font = '16px Arial';
  let yPos = 220;
  stats.forEach((stat, index) => {
    const x = 50 + (index % 2) * 350;
    const y = yPos + Math.floor(index / 2) * 30;
    ctx.fillText(`${stat.label}: ${stat.value}`, x, y);
  });
  
  // Difficulty breakdown
  ctx.font = 'bold 18px Arial';
  ctx.fillText('🎯 Difficulty Breakdown', 50, 380);
  
  ctx.font = '16px Arial';
  const difficulties = [
    { name: 'Easy', stats: playerStats.difficultyStats.easy },
    { name: 'Medium', stats: playerStats.difficultyStats.medium },
    { name: 'Hard', stats: playerStats.difficultyStats.hard }
  ];
  
  difficulties.forEach((diff, index) => {
    const x = 50 + index * 200;
    const y = 420;
    ctx.fillText(`${diff.name}:`, x, y);
    ctx.fillText(`${diff.stats.games} games`, x, y + 20);
    ctx.fillText(`${diff.stats.wins} wins`, x, y + 40);
  });
  
  // Footer
  ctx.fillStyle = '#ffc107';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('💣 Play Minesweeper on Farcaster!', 400, 550);
  
  // Convert canvas to base64 data URL
  return canvas.toDataURL('image/png');
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
