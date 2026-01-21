// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MortgageFactory} from "../src/MortgageFactory.sol";
import {MortgagePositionNFT} from "../src/MortgagePositionNFT.sol";
import {PropertyOracle} from "../src/PropertyOracle.sol";
import {RateFormula} from "../src/RateFormula.sol";
import {WhitelistRegistry} from "../src/WhitelistRegistry.sol";
import {MockUSD} from "../src/MockUSD.sol";

contract MortgageFactoryTest is Test {
    MortgageFactory public factory;
    MortgagePositionNFT public nft;
    PropertyOracle public oracle;
    RateFormula public rateFormula;
    WhitelistRegistry public whitelist;
    MockUSD public token;

    address public owner = address(this);
    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public user = address(0x3);
    address public user2 = address(0x4);

    uint256 public constant PROPERTY_VALUE = 500_000e6; // $500,000
    uint256 public constant DOWN_PAYMENT_BPS = 2000;    // 20%
    uint256 public constant TERM_PERIODS = 12;
    uint256 public constant BASE_RATE_BPS = 500;       // 5%

    event MortgageCreated(
        uint256 indexed tokenId,
        address indexed borrower,
        uint256 indexed propertyId,
        uint256 principal,
        uint256 downPayment,
        uint256 termPeriods
    );
    event PaymentMade(
        uint256 indexed tokenId,
        address indexed payer,
        uint256 amount,
        uint256 principalPaid,
        uint256 interestPaid
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RateFormulaUpdated(address indexed oldFormula, address indexed newFormula);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    function setUp() public {
        // Deploy contracts
        token = new MockUSD();
        oracle = new PropertyOracle();
        rateFormula = new RateFormula(BASE_RATE_BPS);
        whitelist = new WhitelistRegistry();
        nft = new MortgagePositionNFT();

        factory = new MortgageFactory(
            address(token),
            address(oracle),
            address(rateFormula),
            address(whitelist),
            address(nft),
            treasury
        );

        // Grant factory admin rights on NFT
        nft.addAdmin(address(factory));

        // Register a test property
        oracle.registerProperty("123 Main St", PROPERTY_VALUE, "ipfs://metadata");

        // Whitelist test user
        whitelist.whitelistUser(user, "KYC-001");

        // Fund test user with tokens
        token.mint(user, 1_000_000e6);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsPaymentToken() public view {
        assertEq(address(factory.paymentToken()), address(token));
    }

    function test_Constructor_SetsPropertyOracle() public view {
        assertEq(address(factory.propertyOracle()), address(oracle));
    }

    function test_Constructor_SetsRateFormula() public view {
        assertEq(address(factory.rateFormula()), address(rateFormula));
    }

    function test_Constructor_SetsWhitelistRegistry() public view {
        assertEq(address(factory.whitelistRegistry()), address(whitelist));
    }

    function test_Constructor_SetsPositionNFT() public view {
        assertEq(address(factory.positionNFT()), address(nft));
    }

    function test_Constructor_SetsTreasury() public view {
        assertEq(factory.treasury(), treasury);
    }

    function test_Constructor_SetsOwnerAsAdmin() public view {
        assertTrue(factory.isAdmin(owner));
    }

    function test_Constructor_RevertIfZeroAddress() public {
        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(0),
            address(oracle),
            address(rateFormula),
            address(whitelist),
            address(nft),
            treasury
        );

        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(token),
            address(0),
            address(rateFormula),
            address(whitelist),
            address(nft),
            treasury
        );

        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(token),
            address(oracle),
            address(0),
            address(whitelist),
            address(nft),
            treasury
        );

        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(token),
            address(oracle),
            address(rateFormula),
            address(0),
            address(nft),
            treasury
        );

        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(token),
            address(oracle),
            address(rateFormula),
            address(whitelist),
            address(0),
            treasury
        );

        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        new MortgageFactory(
            address(token),
            address(oracle),
            address(rateFormula),
            address(whitelist),
            address(nft),
            address(0)
        );
    }

    // ============ Admin Management Tests ============

    function test_AddAdmin() public {
        vm.expectEmit(true, false, false, false);
        emit AdminAdded(admin);

        factory.addAdmin(admin);
        assertTrue(factory.isAdmin(admin));
    }

    function test_AddAdmin_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        factory.addAdmin(admin);
    }

    function test_AddAdmin_RevertIfZeroAddress() public {
        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        factory.addAdmin(address(0));
    }

    function test_RemoveAdmin() public {
        factory.addAdmin(admin);

        vm.expectEmit(true, false, false, false);
        emit AdminRemoved(admin);

        factory.removeAdmin(admin);
        assertFalse(factory.isAdmin(admin));
    }

    function test_SetTreasury() public {
        address newTreasury = address(0x999);

        vm.expectEmit(true, true, false, false);
        emit TreasuryUpdated(treasury, newTreasury);

        factory.setTreasury(newTreasury);
        assertEq(factory.treasury(), newTreasury);
    }

    function test_SetTreasury_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        factory.setTreasury(address(0x999));
    }

    function test_SetTreasury_RevertIfZeroAddress() public {
        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        factory.setTreasury(address(0));
    }

    function test_SetRateFormula() public {
        RateFormula newFormula = new RateFormula(600);
        address oldFormula = address(rateFormula);

        vm.expectEmit(true, true, false, false);
        emit RateFormulaUpdated(oldFormula, address(newFormula));

        factory.setRateFormula(address(newFormula));
        assertEq(address(factory.rateFormula()), address(newFormula));
    }

    function test_SetRateFormula_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        factory.setRateFormula(address(0x999));
    }

    function test_SetRateFormula_RevertIfZeroAddress() public {
        vm.expectRevert(MortgageFactory.ZeroAddress.selector);
        factory.setRateFormula(address(0));
    }

    // ============ Mortgage Creation Tests ============

    function test_CreateMortgage() public {
        // Approve factory to spend user's tokens
        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        uint256 expectedDownPayment = (PROPERTY_VALUE * DOWN_PAYMENT_BPS) / 10000;
        uint256 expectedPrincipal = PROPERTY_VALUE - expectedDownPayment;

        uint256 userBalanceBefore = token.balanceOf(user);
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);

        vm.prank(user);
        uint256 tokenId = factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal");

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), user);

        // Check down payment was transferred
        assertEq(token.balanceOf(user), userBalanceBefore - expectedDownPayment);
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + expectedDownPayment);

        // Check position details
        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.principal, expectedPrincipal);
        assertEq(pos.downPayment, expectedDownPayment);
        assertEq(pos.termPeriods, TERM_PERIODS);
        assertTrue(pos.isActive);
    }

    function test_CreateMortgage_EmitsEvent() public {
        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        uint256 expectedDownPayment = (PROPERTY_VALUE * DOWN_PAYMENT_BPS) / 10000;
        uint256 expectedPrincipal = PROPERTY_VALUE - expectedDownPayment;

        vm.expectEmit(true, true, true, true);
        emit MortgageCreated(0, user, 0, expectedPrincipal, expectedDownPayment, TERM_PERIODS);

        vm.prank(user);
        factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal");
    }

    function test_CreateMortgage_RevertIfNotWhitelisted() public {
        vm.prank(user2);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user2);
        vm.expectRevert(MortgageFactory.NotWhitelisted.selector);
        factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal");
    }

    function test_CreateMortgage_RevertIfPropertyNotActive() public {
        oracle.deactivateProperty(0);

        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user);
        vm.expectRevert(MortgageFactory.PropertyNotActive.selector);
        factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal");
    }

    function test_CreateMortgage_RevertIfInvalidDownPayment() public {
        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user);
        vm.expectRevert(MortgageFactory.InvalidDownPayment.selector);
        factory.createMortgage(0, 1000, TERM_PERIODS, "ipfs://legal"); // 10% < 20% min
    }

    function test_CreateMortgage_RevertIfInvalidTermLengthTooShort() public {
        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user);
        vm.expectRevert(MortgageFactory.InvalidTermLength.selector);
        factory.createMortgage(0, DOWN_PAYMENT_BPS, 5, "ipfs://legal"); // 5 < 10 min
    }

    function test_CreateMortgage_RevertIfInvalidTermLengthTooLong() public {
        vm.prank(user);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user);
        vm.expectRevert(MortgageFactory.InvalidTermLength.selector);
        factory.createMortgage(0, DOWN_PAYMENT_BPS, 35, "ipfs://legal"); // 35 > 30 max
    }

    // ============ Payment Tests ============

    function _createTestMortgage() internal returns (uint256) {
        vm.startPrank(user);
        token.approve(address(factory), type(uint256).max);
        uint256 tokenId = factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal");
        vm.stopPrank();
        return tokenId;
    }

    function test_MakePayment() public {
        uint256 tokenId = _createTestMortgage();

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        uint256 paymentAmount = pos.paymentPerPeriod;

        uint256 userBalanceBefore = token.balanceOf(user);
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);

        vm.prank(user);
        factory.makePayment(tokenId);

        assertEq(token.balanceOf(user), userBalanceBefore - paymentAmount);
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + paymentAmount);

        pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, 1);
    }

    function test_MakePayment_EmitsEvent() public {
        uint256 tokenId = _createTestMortgage();

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        uint256 paymentAmount = pos.paymentPerPeriod;

        // Calculate expected principal/interest split
        uint256 periodInterest = (pos.remainingPrincipal * pos.rateBps) / rateFormula.BPS_DENOMINATOR();
        uint256 principalPaid = paymentAmount > periodInterest ? paymentAmount - periodInterest : 0;
        uint256 interestPaid = paymentAmount > periodInterest ? periodInterest : paymentAmount;

        vm.expectEmit(true, true, false, true);
        emit PaymentMade(tokenId, user, paymentAmount, principalPaid, interestPaid);

        vm.prank(user);
        factory.makePayment(tokenId);
    }

    function test_MakePayment_RevertIfNotOwner() public {
        uint256 tokenId = _createTestMortgage();

        // Fund user2 with tokens
        token.mint(user2, 1_000_000e6);
        vm.prank(user2);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user2);
        vm.expectRevert(MortgageFactory.NotPositionOwner.selector);
        factory.makePayment(tokenId);
    }

    function test_MakePayment_RevertIfPositionNotActive() public {
        uint256 tokenId = _createTestMortgage();

        // Close position via admin
        nft.closePosition(tokenId, "foreclosure");

        vm.prank(user);
        vm.expectRevert(MortgageFactory.PositionNotActive.selector);
        factory.makePayment(tokenId);
    }

    function test_MakeMultiplePayments() public {
        uint256 tokenId = _createTestMortgage();

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        uint256 paymentAmount = pos.paymentPerPeriod;
        uint256 numPayments = 3;

        uint256 userBalanceBefore = token.balanceOf(user);

        vm.prank(user);
        factory.makeMultiplePayments(tokenId, numPayments);

        // Should deduct 3 payments
        assertEq(token.balanceOf(user), userBalanceBefore - (paymentAmount * numPayments));

        pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, numPayments);
    }

    function test_MakeMultiplePayments_StopsWhenPaidOff() public {
        uint256 tokenId = _createTestMortgage();

        // Try to make more payments than term allows
        vm.prank(user);
        factory.makeMultiplePayments(tokenId, TERM_PERIODS + 5);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, TERM_PERIODS);
        assertFalse(pos.isActive); // Should be closed
    }

    function test_MakePaymentFor() public {
        uint256 tokenId = _createTestMortgage();

        // Fund and approve user2
        token.mint(user2, 1_000_000e6);
        vm.prank(user2);
        token.approve(address(factory), type(uint256).max);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        uint256 paymentAmount = pos.paymentPerPeriod;

        uint256 user2BalanceBefore = token.balanceOf(user2);
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);

        // User2 makes payment on behalf of user
        vm.prank(user2);
        factory.makePaymentFor(tokenId);

        assertEq(token.balanceOf(user2), user2BalanceBefore - paymentAmount);
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + paymentAmount);

        pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, 1);
    }

    function test_MakePaymentFor_RevertIfPositionNotActive() public {
        uint256 tokenId = _createTestMortgage();

        nft.closePosition(tokenId, "foreclosure");

        token.mint(user2, 1_000_000e6);
        vm.prank(user2);
        token.approve(address(factory), type(uint256).max);

        vm.prank(user2);
        vm.expectRevert(MortgageFactory.PositionNotActive.selector);
        factory.makePaymentFor(tokenId);
    }

    // ============ View Functions Tests ============

    function test_GetPaymentAmount() public {
        uint256 tokenId = _createTestMortgage();

        uint256 paymentAmount = factory.getPaymentAmount(tokenId);
        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);

        assertEq(paymentAmount, pos.paymentPerPeriod);
    }

    function test_IsPaymentOverdue_NotOverdue() public {
        uint256 tokenId = _createTestMortgage();

        (bool overdue, uint256 periodsOverdue) = factory.isPaymentOverdue(tokenId);
        assertFalse(overdue);
        assertEq(periodsOverdue, 0);
    }

    function test_IsPaymentOverdue_Overdue() public {
        uint256 tokenId = _createTestMortgage();

        // Warp time by 2 payment intervals (2 minutes for MVP)
        vm.warp(block.timestamp + 120 + 1);

        (bool overdue, uint256 periodsOverdue) = factory.isPaymentOverdue(tokenId);
        assertTrue(overdue);
        assertEq(periodsOverdue, 2);
    }

    function test_IsPaymentOverdue_InactivePosition() public {
        uint256 tokenId = _createTestMortgage();

        nft.closePosition(tokenId, "foreclosure");

        (bool overdue, uint256 periodsOverdue) = factory.isPaymentOverdue(tokenId);
        assertFalse(overdue);
        assertEq(periodsOverdue, 0);
    }

    function test_PreviewMortgage() public view {
        (
            uint256 principal,
            uint256 downPayment,
            uint256 rateBps,
            uint256 paymentPerPeriod,
            uint256 totalPayment,
            uint256 totalInterest
        ) = factory.previewMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS);

        uint256 expectedDownPayment = (PROPERTY_VALUE * DOWN_PAYMENT_BPS) / 10000;
        uint256 expectedPrincipal = PROPERTY_VALUE - expectedDownPayment;

        assertEq(principal, expectedPrincipal);
        assertEq(downPayment, expectedDownPayment);
        assertEq(rateBps, BASE_RATE_BPS);
        assertTrue(paymentPerPeriod > 0);
        assertEq(totalPayment, paymentPerPeriod * TERM_PERIODS);
        assertEq(totalInterest, totalPayment - principal);
    }

    // ============ Full Payment Lifecycle Test ============

    function test_FullPaymentLifecycle() public {
        // Create mortgage
        uint256 tokenId = _createTestMortgage();

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertTrue(pos.isActive);
        assertEq(pos.paymentsCompleted, 0);

        // Make all payments
        for (uint256 i = 0; i < TERM_PERIODS; i++) {
            vm.prank(user);
            factory.makePayment(tokenId);
        }

        // Check position is closed
        pos = nft.getPosition(tokenId);
        assertFalse(pos.isActive);
        assertEq(pos.paymentsCompleted, TERM_PERIODS);
        assertTrue(nft.isPaidOff(tokenId));

        // Check payment history
        MortgagePositionNFT.Payment[] memory payments = nft.getPaymentHistory(tokenId);
        assertEq(payments.length, TERM_PERIODS);
    }

    // ============ Integration Tests ============

    function test_Integration_MultipleUsersMultipleMortgages() public {
        // Whitelist user2
        whitelist.whitelistUser(user2, "KYC-002");

        // Register another property
        oracle.registerProperty("456 Oak Ave", 750_000e6, "ipfs://metadata2");

        // Fund user2
        token.mint(user2, 2_000_000e6);

        // User1 creates mortgage on property 0
        vm.startPrank(user);
        token.approve(address(factory), type(uint256).max);
        uint256 tokenId1 = factory.createMortgage(0, DOWN_PAYMENT_BPS, TERM_PERIODS, "ipfs://legal1");
        vm.stopPrank();

        // User2 creates mortgage on property 1
        vm.startPrank(user2);
        token.approve(address(factory), type(uint256).max);
        uint256 tokenId2 = factory.createMortgage(1, 2500, 15, "ipfs://legal2"); // 25% down, 15 periods
        vm.stopPrank();

        // Verify both mortgages exist
        assertEq(nft.ownerOf(tokenId1), user);
        assertEq(nft.ownerOf(tokenId2), user2);

        // Verify user positions
        uint256[] memory user1Positions = nft.getUserPositions(user);
        uint256[] memory user2Positions = nft.getUserPositions(user2);

        assertEq(user1Positions.length, 1);
        assertEq(user2Positions.length, 1);
        assertEq(user1Positions[0], tokenId1);
        assertEq(user2Positions[0], tokenId2);
    }

    // ============ Fuzz Tests ============

    function testFuzz_CreateMortgage_ValidParams(
        uint16 downPaymentBps,
        uint8 termPeriods
    ) public {
        // Bound inputs to valid ranges
        vm.assume(downPaymentBps >= 2000 && downPaymentBps <= 9000);
        vm.assume(termPeriods >= 10 && termPeriods <= 30);

        vm.startPrank(user);
        token.approve(address(factory), type(uint256).max);
        uint256 tokenId = factory.createMortgage(0, downPaymentBps, termPeriods, "ipfs://legal");
        vm.stopPrank();

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);

        uint256 expectedDownPayment = (PROPERTY_VALUE * downPaymentBps) / 10000;
        uint256 expectedPrincipal = PROPERTY_VALUE - expectedDownPayment;

        assertEq(pos.principal, expectedPrincipal);
        assertEq(pos.downPayment, expectedDownPayment);
        assertEq(pos.termPeriods, termPeriods);
    }
}
