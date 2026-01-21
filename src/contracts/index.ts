// Contract exports - central hub for all Web3 functionality

// ABIs
export {
  MockUSDAbi,
  PropertyOracleAbi,
  WhitelistRegistryAbi,
  RateFormulaAbi,
  MortgagePositionNFTAbi,
  MortgageFactoryAbi,
} from "./abis";

// Addresses
export {
  LOCAL_ADDRESSES,
  ANVIL_CHAIN_ID,
  ANVIL_RPC_URL,
  ANVIL_ACCOUNTS,
  getContractAddresses,
  type ContractAddresses,
} from "./addresses";

// Client utilities
export {
  anvilChain,
  createReadClient,
  createWriteClient,
  createAccountFromPrivateKey,
  ANVIL_PRIVATE_KEYS,
  getReadContracts,
  formatUSD,
  parseUSD,
  formatBps,
  parseBps,
  type ContractInstances,
} from "./client";

// React context and hooks
export { Web3Provider, useWeb3, useAnvilAccounts } from "./Web3Provider";
