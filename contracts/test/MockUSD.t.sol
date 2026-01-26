// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSD} from "../src/MockUSD.sol";

contract MockUSDTest is Test {
    MockUSD public token;
    address public user = address(0x1);

    function setUp() public {
        token = new MockUSD();
    }

    function test_Name() public view {
        assertEq(token.name(), "Mock USD");
    }

    function test_Symbol() public view {
        assertEq(token.symbol(), "mUSD");
    }

    function test_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    function test_FaucetAmount() public view {
        assertEq(token.FAUCET_AMOUNT(), 300_000 * 10 ** 6);
    }

    function test_Faucet() public {
        vm.prank(user);
        token.faucet();
        assertEq(token.balanceOf(user), 300_000 * 10 ** 6);
    }

    function test_FaucetEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit MockUSD.FaucetUsed(user, 300_000 * 10 ** 6);
        vm.prank(user);
        token.faucet();
    }

    function test_MultipleFaucetCalls() public {
        vm.startPrank(user);
        token.faucet();
        token.faucet();
        vm.stopPrank();
        assertEq(token.balanceOf(user), 600_000 * 10 ** 6);
    }

    function test_Mint() public {
        uint256 amount = 5_000 * 10 ** 6;
        token.mint(user, amount);
        assertEq(token.balanceOf(user), amount);
    }

    function test_MintToMultipleAddresses() public {
        address user2 = address(0x2);
        uint256 amount = 1_000 * 10 ** 6;

        token.mint(user, amount);
        token.mint(user2, amount * 2);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.balanceOf(user2), amount * 2);
    }

    function test_Transfer() public {
        address user2 = address(0x2);
        uint256 amount = 1_000 * 10 ** 6;

        token.mint(user, amount);
        vm.prank(user);
        token.transfer(user2, amount / 2);

        assertEq(token.balanceOf(user), amount / 2);
        assertEq(token.balanceOf(user2), amount / 2);
    }
}
