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

    // Base chain NFT contract address
    const CONTRACT_ADDRESS = "0xe998e76dA35333bCa55d5c8375E8E537Bfe7F819";
    const ABI = [
      {
        "inputs":[
          {"internalType":"address","name":"to","type":"address"},
          {"internalType":"string","name":"metadata","type":"string"}
        ],
        "name":"mintResult",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
      }
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    // Create enhanced metadata for the NFT
    const metadata = JSON.stringify({
      name: `Minesweeper - ${gameResult.win ? "Victory" : "Defeat"}`,
      description: `Difficulty: ${gameResult.difficulty}, Time: ${gameResult.time}s, Result: ${gameResult.win ? "Win" : "Loss"}`,
      attributes: [
        { trait_type: "Difficulty", value: gameResult.difficulty },
        { trait_type: "Time", value: gameResult.time },
        { trait_type: "Result", value: gameResult.win ? "Win" : "Lose" },
        { trait_type: "Platform", value: "Farcaster" }
      ]
    });

    const tx = await contract.mintResult(userAddress, metadata, { gasLimit: 500000 });
    showGameMessage("⏳ Minting NFT on Base chain...");
    await tx.wait();
    showGameMessage("NFT minted successfully on Base! 🎉");
    console.log("Minted NFT on Base:", tx);
  } catch (err) {
    console.error("Minting failed:", err);
    showGameMessage("NFT minting failed 😢");
  }
}
