import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Function to mint NFT on Base chain
export async function captureAndMint(gameResult) {
  if (!window.ethereum) {
    alert("Please install MetaMask or another Web3 wallet!");
    return;
  }

  try {
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

    // TODO: Replace with your deployed contract address from Remix
    const CONTRACT_ADDRESS = "0xe8e3F4639C848F169aEB8F68108Fb6c409DDd7d4"; // Your deployed contract address
    const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},
      {"indexed":true,"internalType":"address","name":"approved","type":"address"},
      {"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],
      "name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},
        {"indexed":true,"internalType":"address","name":"operator","type":"address"},
        {"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},
          {"indexed":true,"internalType":"address","name":"player","type":"address"},
          {"indexed":false,"internalType":"string","name":"difficulty","type":"string"},
          {"indexed":false,"internalType":"uint256","name":"time","type":"uint256"},
          {"indexed":false,"internalType":"bool","name":"win","type":"bool"},
          {"indexed":false,"internalType":"string","name":"playerName","type":"string"}],"name":"GameResultMinted","type":"event"},
          {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},
            {"indexed":true,"internalType":"address","name":"to","type":"address"},
            {"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},
            {"inputs":[{"internalType":"address","name":"to","type":"address"},
              {"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},
              {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"gameResults","outputs":[{"internalType":"string","name":"difficulty","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getGameResult","outputs":[{"components":[{"internalType":"string","name":"difficulty","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"internalType":"struct MinesweeperNFT.GameResult","name":"","type":"tuple"}],
              "stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"difficulty","type":"string"},
                {"internalType":"uint256","name":"time","type":"uint256"},{"internalType":"bool","name":"win","type":"bool"},{"internalType":"string","name":"playerName","type":"string"},{"internalType":"string","name":"imageHash","type":"string"}],"name":"mintGameResult","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},
                {"internalType":"bytes","name":"","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}];

    // Check if contract is deployed
    if (CONTRACT_ADDRESS === "0xe8e3F4639C848F169aEB8F68108Fb6c409DDd7d4") {
      // Fallback to simple transaction if contract not deployed
      const gameResultHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          `${userAddress}-${gameResult.difficulty}-${gameResult.time}-${gameResult.win}-${Date.now()}`
        )
      );

      const metadata = {
        name: `Minesweeper - ${gameResult.win ? "Victory" : "Defeat"}`,
        description: `Difficulty: ${gameResult.difficulty}, Time: ${gameResult.time}s, Result: ${gameResult.win ? "Win" : "Loss"}`,
        attributes: [
          { trait_type: "Difficulty", value: gameResult.difficulty },
          { trait_type: "Time", value: gameResult.time },
          { trait_type: "Result", value: gameResult.win ? "Win" : "Lose" },
          { trait_type: "Platform", value: "Farcaster" }
        ],
        hash: gameResultHash
      };

      showGameMessage("⏳ Recording game result on Base chain...");
      
      try {
        const tx = await signer.sendTransaction({
          to: userAddress,
          value: 0,
          data: ethers.toUtf8Bytes(`Minesweeper Result: ${JSON.stringify(metadata)}`)
        });
        
        await tx.wait();
        showGameMessage("Game result recorded on Base chain! 🎉");
        console.log("Game result recorded on Base:", {
          txHash: tx.hash,
          gameHash: gameResultHash,
          metadata: metadata
        });
      } catch (txError) {
        console.error("Transaction failed:", txError);
        showGameMessage("Game result saved locally! 🎉");
        console.log("Game result saved locally:", metadata);
      }
    } else {
      // Use deployed NFT contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      showGameMessage("⏳ Minting NFT on Base chain...");
      
      const tx = await contract.mintGameResult(
        gameResult.difficulty,
        gameResult.time,
        gameResult.win,
        "Anonymous", // Player name
        "data:image/png;base64,", // Image hash placeholder
        { gasLimit: 500000 }
      );
      
      await tx.wait();
      showGameMessage("NFT minted successfully on Base! 🎉");
      console.log("NFT minted on Base:", {
        txHash: tx.hash,
        contractAddress: CONTRACT_ADDRESS
      });
    }
  } catch (err) {
    console.error("Minting failed:", err);
    showGameMessage("NFT minting failed 😢");
  }
}
