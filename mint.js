import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";

// Helper to show messages in Minesweeper UI
function showGameMessage(msg) {
  if (window.gameInstance && window.gameInstance.showShareResult) {
    window.gameInstance.showShareResult(msg);
  } else {
    alert(msg);
  }
}

// Contract configuration for Base chain
const CONTRACT_ADDRESS = "0xDeD9E2Ba6f705aFb182b0d2568aE3468636aCA1b";
const CONTRACT_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"player","type":"address"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"MAX_SUPPLY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"playerTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"remainingSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];

function getFallbackProvider() {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider(window.ethereum, 'any');
  }
  return null;
}

function ensureHexChainId(chainId) {
  if (typeof chainId === 'number') {
    return ethers.utils.hexValue(chainId);
  }
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return chainId;
  }
  return ethers.utils.hexValue(Number(chainId));
}

async function createProvider({ injectedProvider, signer }) {
  if (injectedProvider && typeof injectedProvider.request === 'function') {
    const provider = new ethers.providers.Web3Provider(injectedProvider);
    if (signer) {
      return { provider, signer: signer.connect(provider) };
    }
    return { provider, signer: provider.getSigner() };
  }

  if (signer && signer.provider) {
    return { provider: signer.provider, signer };
  }

  const fallback = getFallbackProvider();
  if (fallback) {
    return { provider: fallback, signer: fallback.getSigner() };
  }

  throw new Error("No compatible Ethereum provider or signer available for minting");
}

async function ensureBaseNetwork(provider) {
  const baseChainIdHex = '0x2105';
  const baseChainIdDecimal = parseInt(baseChainIdHex, 16);

  const currentNetwork = await provider.getNetwork();
  if (currentNetwork.chainId === baseChainIdDecimal) {
    return;
  }

  const baseConfig = {
    chainId: baseChainIdHex,
    chainName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://basescan.org'],
  };

  const jsonRpcProvider = provider.provider;
  if (!jsonRpcProvider || typeof jsonRpcProvider.request !== 'function') {
    throw new Error('Connected provider does not support network switching. Please switch to Base manually.');
  }

  try {
    await jsonRpcProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: baseChainIdHex }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await jsonRpcProvider.request({
        method: 'wallet_addEthereumChain',
        params: [baseConfig],
      });
    } else {
      throw new Error('Please switch to Base chain to mint NFTs');
    }
  }
}

// Simple NFT minting function - just mint with 2500 limit
export async function mintSimpleNFT({ playerAddress, signer: externalSigner, provider: externalProvider, onChainEnforced = true }) {
  try {
    const { provider, signer } = await createProvider({
      injectedProvider: externalProvider,
      signer: externalSigner,
    });

    if (onChainEnforced) {
      await ensureBaseNetwork(provider);
    }

    const resolvedSigner = externalSigner || signer;
    const resolvedAddress = playerAddress || (resolvedSigner ? await resolvedSigner.getAddress() : null);

    if (!resolvedAddress) {
      throw new Error('Unable to determine player address for minting');
    }

    showGameMessage('⏳ Minting Simple NFT...');

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, resolvedSigner);

    try {
      await contract.name();
    } catch (err) {
      throw new Error('Contract not found or not deployed at this address. Please check the contract address.');
    }

    let playerTokenId = ethers.BigNumber.from(0);
    try {
      playerTokenId = await contract.playerTokenId(resolvedAddress);
      if (playerTokenId.gt(0)) {
        throw new Error('You already have an NFT!');
      }
    } catch (err) {
      if (err.message.includes('You already have an NFT')) {
        throw err;
      }
    }

    const remainingSupply = await contract.remainingSupply();
    if (remainingSupply.eq(0)) {
      throw new Error('All 2500 NFTs have been minted!');
    }

    const tx = await contract.mintNFT({ gasLimit: ethers.BigNumber.from('300000') });
    await tx.wait();

    const totalSupply = await contract.totalSupply();
    const mintedTokenId = totalSupply.toNumber();

    showGameMessage(`🎉 Simple NFT #${mintedTokenId} minted successfully!`);

    console.log('Simple NFT minted:', {
      player: resolvedAddress,
      tokenId: mintedTokenId,
      txHash: tx.hash,
      remaining: remainingSupply.sub(1).toNumber(),
    });

    return {
      success: true,
      tokenId: mintedTokenId,
      txHash: tx.hash,
      remaining: remainingSupply.sub(1).toNumber(),
    };
  } catch (err) {
    console.error('Simple NFT minting failed:', err);
    showGameMessage(`❌ Minting failed: ${err.message}`);
    throw err;
  }
}
