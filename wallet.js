const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider,
    options: {
      infuraId: "YOUR_INFURA_ID" // <-- Replace with your Infura Project ID
    }
  }
  // You can add more providers here if needed
};

const web3Modal = new window.Web3Modal.default({
  cacheProvider: false,
  providerOptions
});

async function connectWallet() {
  try {
    const instance = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (e) {
    alert("Wallet connection failed: " + e.message);
    return null;
  }
}

// Make connectWallet available globally
window.connectWallet = connectWallet;
