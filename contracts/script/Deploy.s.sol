// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSD} from "../src/MockUSD.sol";
import {PropertyOracle} from "../src/PropertyOracle.sol";
import {RateFormula} from "../src/RateFormula.sol";
import {WhitelistRegistry} from "../src/WhitelistRegistry.sol";
import {MortgagePositionNFT} from "../src/MortgagePositionNFT.sol";
import {MortgageFactory} from "../src/MortgageFactory.sol";

/**
 * @title Deploy
 * @notice Deployment script for Ancient Protocol MVP on local Anvil chain
 * @dev Deploys all contracts in correct order and sets up initial state:
 *      1. Deploy MockUSD (payment token)
 *      2. Deploy PropertyOracle (property data)
 *      3. Deploy RateFormula (interest calculations)
 *      4. Deploy WhitelistRegistry (KYC gating)
 *      5. Deploy MortgagePositionNFT (soulbound position NFTs)
 *      6. Deploy MortgageFactory (central hub)
 *      7. Configure permissions (Factory as admin on NFT)
 *      8. Register sample properties for testing
 *
 * Usage:
 *   anvil                                           # Start local chain (separate terminal)
 *   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract Deploy is Script {
    // Base interest rate: 5% APR (500 basis points)
    uint256 constant BASE_RATE_BPS = 500;

    // Sample property valuations (6 decimals like MockUSD)
    uint256 constant PROPERTY_1_VALUE = 500_000 * 1e6;  // $500,000
    uint256 constant PROPERTY_2_VALUE = 750_000 * 1e6;  // $750,000
    uint256 constant PROPERTY_3_VALUE = 1_000_000 * 1e6; // $1,000,000

    function run() external {
        // Get deployer private key from environment or use default Anvil account 0
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // Default Anvil account 0 private key
            deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        }

        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // ============ Deploy Core Contracts ============

        // 1. Deploy MockUSD (payment token)
        MockUSD mockUSD = new MockUSD();
        console.log("MockUSD deployed at:", address(mockUSD));

        // 2. Deploy PropertyOracle
        PropertyOracle propertyOracle = new PropertyOracle();
        console.log("PropertyOracle deployed at:", address(propertyOracle));

        // 3. Deploy RateFormula with 5% base rate
        RateFormula rateFormula = new RateFormula(BASE_RATE_BPS);
        console.log("RateFormula deployed at:", address(rateFormula));

        // 4. Deploy WhitelistRegistry
        WhitelistRegistry whitelistRegistry = new WhitelistRegistry();
        console.log("WhitelistRegistry deployed at:", address(whitelistRegistry));

        // 5. Deploy MortgagePositionNFT
        MortgagePositionNFT positionNFT = new MortgagePositionNFT();
        console.log("MortgagePositionNFT deployed at:", address(positionNFT));

        // 6. Deploy MortgageFactory (treasury = deployer for simplicity)
        MortgageFactory factory = new MortgageFactory(
            address(mockUSD),
            address(propertyOracle),
            address(rateFormula),
            address(whitelistRegistry),
            address(positionNFT),
            deployer // Treasury receives all payments
        );
        console.log("MortgageFactory deployed at:", address(factory));

        // ============ Configure Permissions ============

        // Grant MortgageFactory admin rights on MortgagePositionNFT
        // (Factory needs to mint positions and record payments)
        positionNFT.addAdmin(address(factory));
        console.log("MortgageFactory granted admin on MortgagePositionNFT");

        // ============ Register Sample Properties ============

        // Property 1: Small House - $500,000
        uint256 prop1 = propertyOracle.registerProperty(
            "123 Main Street, Springfield, IL 62701",
            PROPERTY_1_VALUE,
            "ipfs://QmSampleProperty1Metadata"
        );
        console.log("Property 1 registered with ID:", prop1);

        // Property 2: Medium House - $750,000
        uint256 prop2 = propertyOracle.registerProperty(
            "456 Oak Avenue, Chicago, IL 60601",
            PROPERTY_2_VALUE,
            "ipfs://QmSampleProperty2Metadata"
        );
        console.log("Property 2 registered with ID:", prop2);

        // Property 3: Large House - $1,000,000
        uint256 prop3 = propertyOracle.registerProperty(
            "789 Lake Drive, Naperville, IL 60540",
            PROPERTY_3_VALUE,
            "ipfs://QmSampleProperty3Metadata"
        );
        console.log("Property 3 registered with ID:", prop3);

        // ============ Whitelist Deployer (for testing) ============
        whitelistRegistry.whitelistUser(deployer, "DEPLOYER_KYC_001");
        console.log("Deployer whitelisted for testing");

        vm.stopBroadcast();

        // ============ Output Summary ============
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("Network: Local Anvil Chain");
        console.log("Deployer:", deployer);
        console.log("");
        console.log("Contract Addresses:");
        console.log("  MockUSD:            ", address(mockUSD));
        console.log("  PropertyOracle:     ", address(propertyOracle));
        console.log("  RateFormula:        ", address(rateFormula));
        console.log("  WhitelistRegistry:  ", address(whitelistRegistry));
        console.log("  MortgagePositionNFT:", address(positionNFT));
        console.log("  MortgageFactory:    ", address(factory));
        console.log("");
        console.log("Configuration:");
        console.log("  Base Interest Rate: ", BASE_RATE_BPS, "bps (5%)");
        console.log("  Treasury:           ", deployer);
        console.log("  Properties Registered: 3");
        console.log("");
        console.log("Sample Properties:");
        console.log("  ID 0: $500,000 - 123 Main Street");
        console.log("  ID 1: $750,000 - 456 Oak Avenue");
        console.log("  ID 2: $1,000,000 - 789 Lake Drive");
        console.log("=========================================\n");
    }
}
