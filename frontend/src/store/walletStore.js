import { create } from "zustand";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import api from "../services/api";

const useWalletStore = create((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  balance: "0",
  isConnected: false,
  isConnecting: false,

  connect: async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask.");
      return;
    }

    set({ isConnecting: true });
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(accounts[0]);

      set({
        provider,
        signer,
        address: accounts[0],
        chainId: network.chainId.toString(),
        balance: ethers.formatEther(balance),
        isConnected: true,
        isConnecting: false,
      });

      // Save wallet address to backend
      try {
        await api.put("/auth/wallet", { walletAddress: accounts[0] });
      } catch (e) {
        console.warn("Could not save wallet to backend:", e.message);
      }

      toast.success("Wallet connected successfully!");

      // Listen for account changes
      window.ethereum.on("accountsChanged", (newAccounts) => {
        if (newAccounts.length === 0) {
          get().disconnect();
        } else {
          set({ address: newAccounts[0] });
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      set({ isConnecting: false });
      toast.error(error.message || "Failed to connect wallet");
    }
  },

  disconnect: () => {
    set({
      provider: null,
      signer: null,
      address: null,
      chainId: null,
      balance: "0",
      isConnected: false,
    });
    toast.success("Wallet disconnected");
  },

  refreshBalance: async () => {
    const { provider, address } = get();
    if (!provider || !address) return;
    const balance = await provider.getBalance(address);
    set({ balance: ethers.formatEther(balance) });
  },

  getContract: (address, abi) => {
    const { signer, provider } = get();
    return new ethers.Contract(address, abi, signer || provider);
  },
}));

export default useWalletStore;
