// Web3 client configuration using viem
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Address,
  formatUnits,
  parseUnits,
  getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getContractAddresses, ANVIL_RPC_URL, ANVIL_CHAIN_ID } from "./addresses";
import {
  MockUSDAbi,
  PropertyOracleAbi,
  WhitelistRegistryAbi,
  RateFormulaAbi,
  MortgagePositionNFTAbi,
  MortgageFactoryAbi,
} from "./abis";

// Define local Anvil chain
export const anvilChain: Chain = {
  id: ANVIL_CHAIN_ID,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [ANVIL_RPC_URL],
    },
  },
};

// Create public client (read-only)
export function createReadClient(): PublicClient {
  return createPublicClient({
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}

// Create wallet client (read + write with account)
export function createWriteClient(account: Account): WalletClient {
  return createWalletClient({
    account,
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}

// Create account from private key
export function createAccountFromPrivateKey(privateKey: `0x${string}`): Account {
  return privateKeyToAccount(privateKey);
}

// Default Anvil account private keys (for testing)
export const ANVIL_PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account 1
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account 2
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account 3
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account 4
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", // Account 5
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e", // Account 6
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356", // Account 7
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97", // Account 8
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6", // Account 9
] as const;

// Contract instances interface - using 'any' for viem contract bindings
// since viem's generic types are complex and we get proper typing at call sites
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ContractInstances {
  mockUSD: any;
  propertyOracle: any;
  rateFormula: any;
  whitelistRegistry: any;
  mortgagePositionNFT: any;
  mortgageFactory: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Get contract instances with read client
export function getReadContracts(client: PublicClient): ContractInstances {
  const addresses = getContractAddresses();

  return {
    mockUSD: getContract({
      address: addresses.mockUSD,
      abi: MockUSDAbi,
      client,
    }),
    propertyOracle: getContract({
      address: addresses.propertyOracle,
      abi: PropertyOracleAbi,
      client,
    }),
    rateFormula: getContract({
      address: addresses.rateFormula,
      abi: RateFormulaAbi,
      client,
    }),
    whitelistRegistry: getContract({
      address: addresses.whitelistRegistry,
      abi: WhitelistRegistryAbi,
      client,
    }),
    mortgagePositionNFT: getContract({
      address: addresses.mortgagePositionNFT,
      abi: MortgagePositionNFTAbi,
      client,
    }),
    mortgageFactory: getContract({
      address: addresses.mortgageFactory,
      abi: MortgageFactoryAbi,
      client,
    }),
  };
}

// Utility: Format MockUSD amount (6 decimals)
export function formatUSD(amount: bigint): string {
  return formatUnits(amount, 6);
}

// Utility: Parse MockUSD amount (6 decimals)
export function parseUSD(amount: string): bigint {
  return parseUnits(amount, 6);
}

// Utility: Format basis points as percentage
export function formatBps(bps: bigint | number): string {
  const value = typeof bps === "bigint" ? Number(bps) : bps;
  return (value / 100).toFixed(2) + "%";
}

// Utility: Parse percentage to basis points
export function parseBps(percentage: number): number {
  return Math.round(percentage * 100);
}
