import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Function to mint NFT
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

    // Replace with your contract address and ABI
    const CONTRACT_ADDRESS = "0xe998e76dA35333bCa55d5c8375E8E537Bfe7F819";
    const ABI = [
      // Make sure your contract has a mintResult(address, string) function
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

    // Create a simple string for the NFT metadata
    const metadata = JSON.stringify({
      difficulty: gameResult.difficulty,
      time: gameResult.time,
      win: gameResult.win
    });

    const tx = await contract.mintResult(userAddress, metadata, { gasLimit: 200000 });
    showGameMessage("⏳ Minting NFT...");
    await tx.wait();
    showGameMessage("NFT minted successfully! 🎉");
    console.log("Minted NFT:", tx);
  } catch (err) {
    console.error("Minting failed:", err);
    showGameMessage("NFT minting failed 😢");
  }
}
