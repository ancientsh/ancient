// Contract addresses for local Anvil deployment
// These are deterministic addresses based on deployer (Anvil account 0) and nonce
// Regenerate by running: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

import type { Address } from "viem";

export interface ContractAddresses {
  mockUSD: Address;
  propertyOracle: Address;
  rateFormula: Address;
  whitelistRegistry: Address;
  mortgagePositionNFT: Address;
  mortgageFactory: Address;
}

// Default local Anvil deployment addresses
// These will be populated after deployment
export const LOCAL_ADDRESSES: ContractAddresses = {
  mockUSD: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  propertyOracle: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  rateFormula: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  whitelistRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  mortgagePositionNFT: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  mortgageFactory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
};

// Chain configuration
export const ANVIL_CHAIN_ID = 31337;
export const ANVIL_RPC_URL = "http://localhost:8545";

// Default Anvil accounts (first 10 accounts with 10000 ETH each)
export const ANVIL_ACCOUNTS = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0 (deployer)
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account 3
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account 4
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account 5
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Account 6
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", // Account 7
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", // Account 8
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", // Account 9
] as const;

// Get addresses for current environment
export function getContractAddresses(): ContractAddresses {
  // In the future, this could check environment variables or network
  return LOCAL_ADDRESSES;
}
