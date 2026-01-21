// Web3 React Context and Provider
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type PublicClient,
  type WalletClient,
  type Account,
  type Address,
} from "viem";

import {
  createReadClient,
  createWriteClient,
  createAccountFromPrivateKey,
  ANVIL_PRIVATE_KEYS,
  type ContractInstances,
  getReadContracts,
} from "./client";
import { ANVIL_ACCOUNTS } from "./addresses";

interface Web3State {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Clients
  publicClient: PublicClient | null;
  walletClient: WalletClient | null;

  // Account
  account: Account | null;
  address: Address | null;
  accountIndex: number;

  // Contracts
  contracts: ContractInstances | null;

  // Actions
  connect: (accountIndex?: number) => Promise<void>;
  disconnect: () => void;
  switchAccount: (accountIndex: number) => Promise<void>;
}

const Web3Context = createContext<Web3State | null>(null);

export function useWeb3(): Web3State {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [accountIndex, setAccountIndex] = useState(0);
  const [contracts, setContracts] = useState<ContractInstances | null>(null);

  // Connect to local Anvil chain
  const connect = useCallback(async (index: number = 0) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Create public client
      const readClient = createReadClient();

      // Verify connection by getting chain ID
      const chainId = await readClient.getChainId();
      if (chainId !== 31337) {
        throw new Error(`Expected Anvil chain (31337), got ${chainId}`);
      }

      // Create account from private key
      const privateKey = ANVIL_PRIVATE_KEYS[index];
      if (!privateKey) {
        throw new Error(`Invalid account index: ${index}`);
      }
      const acc = createAccountFromPrivateKey(privateKey);

      // Create wallet client
      const writeClient = createWriteClient(acc);

      // Get contract instances
      const contractInstances = getReadContracts(readClient);

      // Update state
      setPublicClient(readClient);
      setWalletClient(writeClient);
      setAccount(acc);
      setAddress(acc.address);
      setAccountIndex(index);
      setContracts(contractInstances);
      setIsConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setPublicClient(null);
    setWalletClient(null);
    setAccount(null);
    setAddress(null);
    setContracts(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Switch account
  const switchAccount = useCallback(async (index: number) => {
    if (index < 0 || index >= ANVIL_PRIVATE_KEYS.length) {
      throw new Error(`Invalid account index: ${index}`);
    }
    await connect(index);
  }, [connect]);

  // Auto-connect on mount
  useEffect(() => {
    connect(0);
  }, [connect]);

  const value: Web3State = {
    isConnected,
    isConnecting,
    error,
    publicClient,
    walletClient,
    account,
    address,
    accountIndex,
    contracts,
    connect,
    disconnect,
    switchAccount,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

// Hook to get available Anvil accounts
export function useAnvilAccounts(): { address: Address; index: number }[] {
  return ANVIL_ACCOUNTS.map((address, index) => ({ address: address as Address, index }));
}
