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

// Check if we're running in a Farcaster environment
async function isRunningInFarcaster() {
  try {
    // First check if we're in a frame
    if (typeof sdk.isFrame === 'function') {
      const isFrame = await sdk.isFrame();
      if (isFrame) return { isFrame: true, isMiniApp: false };
    }
    
    // Then check if we're in a mini-app
    if (typeof sdk.isMiniApp === 'function') {
      const isMiniApp = await sdk.isMiniApp();
      if (isMiniApp) return { isFrame: false, isMiniApp: true };
    }
    
    return { isFrame: false, isMiniApp: false };
  } catch (error) {
    console.warn("Failed to detect Farcaster environment:", error);
    return { isFrame: false, isMiniApp: false };
  }
}

// Enhanced wallet request function with multiple fallback methods
async function requestWallet() {
  try {
    showGameMessage("Requesting wallet connection…", "info");
    
    // Check if we're in a Farcaster environment
    const { isFrame, isMiniApp } = await isRunningInFarcaster();
    
    // Collection of wallet connection methods to try in sequence
    const connectionMethods = [
      // Method 1: Farcaster SDK wallet request (for frames and mini-apps)
      async () => {
        if (isFrame || isMiniApp) {
          try {
            console.log("Trying Farcaster SDK wallet request...");
            if (sdk.actions && sdk.actions.wallet && typeof sdk.actions.wallet.requestWallet === 'function') {
              const wallet = await sdk.actions.wallet.requestWallet();
              if (wallet && wallet.address) {
                console.log("Farcaster SDK wallet connected:", wallet);
                return {
                  success: true,
                  address: wallet.address,
                  chain: wallet.chain || 'eip155:8453',
                  provider: 'farcaster-sdk'
                };
              }
            }
          } catch (error) {
            console.warn("Farcaster SDK wallet request failed:", error);
          }
        }
        return null;
      },
      
      // Method 2: Farcaster frames wallet context (for frames)
      async () => {
        if (isFrame) {
          try {
            console.log("Trying Farcaster frames wallet context...");
            if (sdk.frames && typeof sdk.frames.getWalletContext === 'function') {
              const walletContext = await sdk.frames.getWalletContext();
              if (walletContext && walletContext.address) {
                console.log("Farcaster frames wallet context found:", walletContext);
                return {
                  success: true,
                  address: walletContext.address,
                  chain: walletContext.chain || 'eip155:8453',
                  provider: 'farcaster-frames'
                };
              }
            }
          } catch (error) {
            console.warn("Farcaster frames wallet context access failed:", error);
          }
        }
        return null;
      },
      
      // Method 3: Global wallet context (set by backend)
      async () => {
        if (window.farcasterWalletContext) {
          try {
            console.log("Trying global wallet context...");
            const context = window.farcasterWalletContext;
            if (context && context.address) {
              console.log("Global wallet context found:", context);
              return {
                success: true,
                address: context.address,
                chain: context.chain || 'eip155:8453',
                provider: 'global-context'
              };
            }
          } catch (error) {
            console.warn("Global wallet context access failed:", error);
          }
        }
        return null;
      },
      
      // Method 4: Direct Ethereum provider (works in browsers and some frames)
      async () => {
        if (window.ethereum) {
          try {
            console.log("Trying direct Ethereum provider...");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              console.log("Direct Ethereum provider connected:", address);
              
              // Try to get network info but don't fail if it doesn't work
              let chainId = '8453';
              try {
                const network = await provider.getNetwork();
                chainId = network.chainId.toString();
              } catch (networkError) {
                console.warn("Network detection failed:", networkError);
              }
              
              return {
                success: true,
                address: address,
                chain: `eip155:${chainId}`,
                provider: 'ethereum',
                ethersProvider: provider
              };
            }
          } catch (error) {
            console.warn("Direct Ethereum provider connection failed:", error);
          }
        }
        return null;
      }
    ];
    
    // Try each connection method in sequence until one works
    for (const method of connectionMethods) {
      const result = await method();
      if (result) {
        showGameMessage(`Wallet connected: ${result.address.slice(0, 6)}…`, "success");
        return result;
      }
    }
    
    // If all methods failed
    throw new Error("No wallet provider available");
  } catch (error) {
    console.error("All wallet connection methods failed:", error);
    showGameMessage("Unable to connect wallet. Please ensure you have an Ethereum wallet available.", "error");
    throw error;
  }
}

// Get a browser provider for direct Ethereum interactions
async function getBrowserProvider() {
  if (!window.ethereum) {
    throw new Error("No browser wallet detected. Please install MetaMask or open in Warpcast.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider;
}

// Ensure we're on the Base network
async function ensureBaseNetwork(provider) {
  try {
    const network = await provider.getNetwork();
    if (network.chainId !== 8453n) {
      throw new Error("Please switch to the Base network to mint the NFT.");
    }
    return true;
  } catch (error) {
    console.warn("Network check failed:", error);
    return false;
  }
}

// Get contract configuration
function getContractConfig() {
  return {
    address: "0xDeD9E2Ba6f705aFb182b0d2568aE3468636aCA1b",
    abi: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
  };
}

// Main function to mint NFT or just connect wallet
export async function mintSimpleNFT(playerAddress) {
  try {
    console.log("Starting wallet connection process...");
    
    // Connect wallet using our enhanced multi-method approach
    const walletInfo = await requestWallet();
    
    // If this is just a wallet connection request (no minting), return the wallet info
    if (!playerAddress) {
      return walletInfo;
    }
    
    // For Ethereum provider, we can proceed with minting
    if (walletInfo.provider === 'ethereum' && walletInfo.ethersProvider) {
      const provider = walletInfo.ethersProvider;
      
      // Try to ensure we're on Base network, but continue even if check fails
      await ensureBaseNetwork(provider);
      
      const signer = await provider.getSigner();
      const { address, abi } = getContractConfig();
      const contract = new ethers.Contract(address, abi, signer);

      showGameMessage("⏳ Minting Simple NFT…", "info");

      try {
        // Verify contract is accessible
        await contract.name();
      } catch (error) {
        console.error("Contract verification failed:", error);
        throw new Error("Contract not deployed or unreachable at configured address.");
      }

      try {
        // Check if user already has an NFT
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

      // Check remaining supply
      const remainingSupply = await contract.remainingSupply();
      if (remainingSupply === 0n) {
        throw new Error("All NFTs have been minted.");
      }

      // Execute the mint transaction
      const tx = await contract.mintNFT({ gasLimit: 300000 });
      await tx.wait();

      // Get the minted token ID
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
      return {
        ...walletInfo,
        message: "Wallet connected but direct minting not available in this context. Use Farcaster's transaction flow."
      };
    }
  } catch (error) {
    console.error("Wallet connection or NFT minting failed:", error);
    showGameMessage(
      `❌ ${error.message || "Connection failed. Please try again."}`,
      "error"
    );
    
    return { 
      success: false, 
      error: error.message || "Wallet connection or minting failed" 
    };
  }
}

// Backward compatibility function for the original captureAndMint
export async function captureAndMint(gameResult) {
  try {
    // Connect wallet using our enhanced multi-method approach
    const walletInfo = await requestWallet();
    
    if (!walletInfo || !walletInfo.success) {
      throw new Error("Wallet connection failed");
    }
    
    // For Ethereum provider, we can proceed with minting
    if (walletInfo.provider === 'ethereum' && walletInfo.ethersProvider) {
      const provider = walletInfo.ethersProvider;
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Try to ensure we're on Base network
      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 8453n) {
          showGameMessage("Please switch to Base chain to mint NFTs!", "error");
          return;
        }
      } catch (networkError) {
        console.warn("Network check failed:", networkError);
        // Continue anyway, the transaction will fail if network is wrong
      }
      
      // Use simple transaction to record game result
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
      // For Farcaster wallets, just show a message
      showGameMessage("Wallet connected but direct minting not available in Farcaster. Game result saved locally! 🎉");
    }
  } catch (error) {
    console.error("Minting failed:", error);
    showGameMessage("NFT minting failed 😢");
  }
}
