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
    
    // Check if we're in a Farcaster frame
    const isFrame = await sdk.isFrame();
    
    if (isFrame) {
      // Use the frame-specific wallet request method
      try {
        // First try the newer method for frames
        const wallet = await sdk.actions.wallet.requestWallet();
        if (!wallet?.address) {
          throw new Error("Wallet address missing in Farcaster response");
        }
        showGameMessage(`Wallet connected: ${wallet.address.slice(0, 6)}…`, "success");
        return wallet;
      } catch (frameError) {
        console.warn("Frame wallet request failed, trying fallback method:", frameError);
        
        // Fallback for older Farcaster SDK versions
        if (sdk.frames && typeof sdk.frames.getWalletContext === 'function') {
          const walletContext = await sdk.frames.getWalletContext();
          if (walletContext && walletContext.address) {
            showGameMessage(`Wallet connected: ${walletContext.address.slice(0, 6)}…`, "success");
            return walletContext;
          }
        }
        
        // If we're in a frame but can't get wallet, provide clear error
        throw new Error("Wallet connection not supported in this Farcaster frame version");
      }
    } else {
      // Standard mini-app wallet request
      const wallet = await sdk.actions.wallet.requestWallet();
      if (!wallet?.address) {
        throw new Error("Wallet address missing in Farcaster response");
      }
      showGameMessage(`Wallet connected: ${wallet.address.slice(0, 6)}…`, "success");
      return wallet;
    }
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
    // First check if we're in a Farcaster environment (frame or mini-app)
    const isFarcasterEnv = await isRunningInMiniApp();
    
    if (isFarcasterEnv) {
      try {
        // Try to get wallet via Farcaster SDK
        const farcasterWallet = await requestFrameWallet();
        if (farcasterWallet && farcasterWallet.address) {
          showGameMessage(`Connected via Farcaster: ${farcasterWallet.address.slice(0, 8)}...`, "success");
          return {
            success: true,
            address: farcasterWallet.address,
            chain: farcasterWallet.chain || 'eip155:1'
          };
        }
      } catch (farcasterError) {
        console.warn("Farcaster wallet connection failed, trying fallbacks:", farcasterError);
        
        // Check for wallet context from backend (for frames)
        const farcasterWalletContext = window.farcasterWalletContext || null;
        if (farcasterWalletContext && farcasterWalletContext.address) {
          showGameMessage(`Connected via Farcaster: ${farcasterWalletContext.address.slice(0, 8)}...`, "success");
          return {
            success: true,
            address: farcasterWalletContext.address,
            chain: farcasterWalletContext.chain || 'eip155:1'
          };
        }
      }
    }
    
    // Fallback: Browser wallet (MetaMask, Coinbase, etc.)
    if (window.ethereum) {
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
    } else {
      // No wallet available at all
      showGameMessage(
        "No wallet detected. Please open in Warpcast (Farcaster) or use a Web3 browser like MetaMask.",
        "error"
      );
      return { success: false, error: "No wallet detected" };
    }
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
