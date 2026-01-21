// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSD
 * @notice A simple mock USD stablecoin for testing mortgage payments
 * @dev Anyone can mint tokens via the faucet function for testing purposes
 */
contract MockUSD is ERC20 {
    uint8 private constant DECIMALS = 6; // USDC-like decimals
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** DECIMALS; // 10,000 USD per faucet call

    event FaucetUsed(address indexed user, uint256 amount);

    constructor() ERC20("Mock USD", "mUSD") {}

    /**
     * @notice Returns the number of decimals (6, like USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mint test tokens to the caller
     * @dev Anyone can call this for testing purposes
     */
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetUsed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Mint a specific amount of tokens to an address
     * @param to The address to receive tokens
     * @param amount The amount of tokens to mint
     * @dev Anyone can call this for testing purposes
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
