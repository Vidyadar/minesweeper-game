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
    showGameMessage("Requesting wallet connection…", "info");
    
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
        
        // Try to use Ethereum provider directly if available in frame
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            showGameMessage(`Ethereum wallet connected: ${address.slice(0, 6)}…`, "success");
            return { address, chain: 'eip155:8453' };
          }
        }
        
        // If we're in a frame but can't get wallet, provide clear error
        throw new Error("No Ethereum wallet provider available in Farcaster frame");
      }
    } else {
      // Standard mini-app wallet request
      try {
        const wallet = await sdk.actions.wallet.requestWallet();
        if (!wallet?.address) {
          throw new Error("Wallet address missing in Farcaster response");
        }
        showGameMessage(`Wallet connected: ${wallet.address.slice(0, 6)}…`, "success");
        return wallet;
      } catch (miniAppError) {
        console.warn("Mini-app wallet request failed, trying Ethereum provider:", miniAppError);
        
        // Try to use Ethereum provider directly
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            showGameMessage(`Ethereum wallet connected: ${address.slice(0, 6)}…`, "success");
            return { address, chain: 'eip155:8453' };
          }
        }
        
        throw miniAppError;
      }
    }
  } catch (error) {
    console.error("Wallet connection failed", error);
    showGameMessage("Unable to connect wallet. Please ensure you have an Ethereum wallet available.", "error");
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
    let walletInfo = null;
    
    // Try multiple wallet connection methods in sequence
    const connectionMethods = [
      // Method 1: Farcaster SDK wallet (works in both frames and mini-apps)
      async () => {
        if (isFarcasterEnv) {
          try {
            const farcasterWallet = await requestFrameWallet();
            if (farcasterWallet && farcasterWallet.address) {
              showGameMessage(`Connected via Farcaster: ${farcasterWallet.address.slice(0, 8)}...`, "success");
              return {
                success: true,
                address: farcasterWallet.address,
                chain: farcasterWallet.chain || 'eip155:8453',
                provider: 'farcaster'
              };
            }
          } catch (error) {
            console.warn("Farcaster SDK wallet connection failed:", error);
            return null;
          }
        }
        return null;
      },
      
      // Method 2: Check for wallet context from backend (for frames)
      async () => {
        if (isFarcasterEnv && window.farcasterWalletContext) {
          try {
            const context = window.farcasterWalletContext;
            if (context && context.address) {
              showGameMessage(`Connected via Farcaster context: ${context.address.slice(0, 8)}...`, "success");
              return {
                success: true,
                address: context.address,
                chain: context.chain || 'eip155:8453',
                provider: 'farcaster-context'
              };
            }
          } catch (error) {
            console.warn("Farcaster wallet context access failed:", error);
            return null;
          }
        }
        return null;
      },
      
      // Method 3: Direct Ethereum provider (works in browsers and some frames)
      async () => {
        if (window.ethereum) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              
              // Try to ensure we're on Base network
              try {
                await ensureBaseNetwork(provider);
              } catch (networkError) {
                console.warn("Network check failed:", networkError);
                // Continue anyway, the transaction will fail if network is wrong
              }
              
              showGameMessage(`Ethereum wallet connected: ${address.slice(0, 8)}...`, "success");
              return {
                success: true,
                address: address,
                chain: 'eip155:8453',
                provider: 'ethereum',
                ethersProvider: provider
              };
            }
          } catch (error) {
            console.warn("Direct Ethereum provider connection failed:", error);
            return null;
          }
        }
        return null;
      }
    ];
    
    // Try each connection method in sequence until one works
    for (const method of connectionMethods) {
      walletInfo = await method();
      if (walletInfo) break;
    }
    
    // If we have a wallet connection, proceed with minting or return the wallet info
    if (walletInfo) {
      // If this is just a wallet connection request (no minting), return the wallet info
      if (!playerAddress) {
        return walletInfo;
      }
      
      // For Ethereum provider, we can proceed with minting
      if (walletInfo.provider === 'ethereum' && walletInfo.ethersProvider) {
        const provider = walletInfo.ethersProvider;
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
        // For Farcaster wallets, we just return the connection info
        // The actual minting would happen through Farcaster's transaction system
        return walletInfo;
      }
    }
    
    // If all connection methods failed
    showGameMessage(
      "No wallet could be connected. Please ensure you have an Ethereum wallet available or try in Warpcast.",
      "error"
    );
    return { 
      success: false, 
      error: "No wallet provider available" 
    };
  } catch (error) {
    console.error("Wallet connection or NFT minting failed", error);
    showGameMessage(
      `❌ ${error.message || "Connection failed. Please try again."}`,
      "error"
    );
    throw error;
  }
}
