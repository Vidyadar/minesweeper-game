import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.8.0/dist/ethers.min.js";
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg, type = "info") {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg, type);
  } else {
    alert(msg);
  }
}

async function isRunningInMiniApp() {
  try {
    return await sdk.isMiniApp();
  } catch (error) {
    console.warn("Failed to detect Farcaster mini-app environment:", error);
    return false;
  }
}

async function requestFrameWallet() {
  try {
    showGameMessage("Requesting Farcaster wallet…", "info");
    const wallet = await sdk.actions.wallet.requestWallet();
    if (!wallet?.address) {
      throw new Error("Wallet address missing in Farcaster response");
    }
    showGameMessage(`Wallet connected: ${wallet.address.slice(0, 6)}…`, "success");
    return wallet;
  } catch (error) {
    console.error("Farcaster wallet request failed", error);
    showGameMessage("Unable to connect wallet inside Farcaster frame.", "error");
    throw error;
  }
}

async function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("No browser wallet detected. Please install MetaMask or open in Warpcast.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider;
}

async function ensureBaseNetwork(provider) {
  const network = await provider.getNetwork();
  if (network.chainId !== 8453n) {
    throw new Error("Please switch to the Base network to mint the NFT.");
  }
}

function getContractConfig() {
  return {
    address: "0xDeD9E2Ba6f705aFb182b0d2568aE3468636aCA1b",
    abi: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
  };
}

export async function mintSimpleNFT(playerAddress) {
  try {
    const isMiniApp = await isRunningInMiniApp();
    if (isMiniApp) {
      // Try to request wallet, but if not available, show a friendly message
      try {
        const wallet = await requestFrameWallet();
        return { frameWallet: wallet, success: true };
      } catch (error) {
        showGameMessage(
          "Wallet connection is not supported in Farcaster frame. Please open this app in a browser with a wallet provider (e.g., MetaMask) to mint.",
          "error"
        );
        return { success: false, error: "No wallet provider in Farcaster frame" };
      }
    }

    const provider = await getBrowserProvider();
    await ensureBaseNetwork(provider);
    const signer = await provider.getSigner();

    const { address, abi } = getContractConfig();
    const contract = new ethers.Contract(address, abi, signer);

    showGameMessage("⏳ Minting Simple NFT…", "info");

    try {
      await contract.name();
    } catch (error) {
      throw new Error("Contract not deployed or unreachable at configured address.");
    }

    try {
      const playerTokenId = await contract.playerTokenId(playerAddress);
      if (playerTokenId > 0n) {
        throw new Error("You already minted this NFT.");
      }
    } catch (error) {
      if (error.message?.includes("already minted")) {
        throw error;
      }
      console.warn("Unable to verify existing NFT. Proceeding with mint.", error);
    }

    const remainingSupply = await contract.remainingSupply();
    if (remainingSupply === 0n) {
      throw new Error("All NFTs have been minted.");
    }

    const tx = await contract.mintNFT({ gasLimit: 300000 });
    await tx.wait();

    const totalSupply = await contract.totalSupply();
    const mintedTokenId = Number(totalSupply);

    showGameMessage(`🎉 Simple NFT #${mintedTokenId} minted successfully!`, "success");

    return {
      success: true,
      tokenId: mintedTokenId,
      txHash: tx.hash,
      remaining: Number(remainingSupply) - 1
    };
  } catch (error) {
    console.error("Simple NFT minting failed", error);
    showGameMessage(
      error.message === "No wallet provider in Farcaster frame"
        ? "Wallet connection is not available in Farcaster frame. Please use a browser with a wallet provider."
        : `❌ Minting failed: ${error.message}`,
      "error"
    );
    throw error;
  }
}
