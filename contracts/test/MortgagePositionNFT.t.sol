// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MortgagePositionNFT} from "../src/MortgagePositionNFT.sol";

contract MortgagePositionNFTTest is Test {
    MortgagePositionNFT public nft;

    address public owner = address(this);
    address public admin = address(0x1);
    address public factory = address(0x2);
    address public user = address(0x3);
    address public user2 = address(0x4);

    event PositionCreated(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 indexed propertyId,
        uint256 principal,
        uint256 termPeriods
    );
    event PaymentRecorded(
        uint256 indexed tokenId,
        uint256 amount,
        uint256 periodNumber,
        uint256 remainingPrincipal
    );
    event PositionClosed(uint256 indexed tokenId, string reason);
    event PositionTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string reason
    );
    event LegalContractUpdated(uint256 indexed tokenId, string newURI);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    function setUp() public {
        nft = new MortgagePositionNFT();
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsName() public view {
        assertEq(nft.name(), "Ancient Mortgage Position");
    }

    function test_Constructor_SetsSymbol() public view {
        assertEq(nft.symbol(), "AMP");
    }

    function test_Constructor_SetsOwnerAsAdmin() public view {
        assertTrue(nft.isAdmin(owner));
    }

    function test_Constructor_SetsOwner() public view {
        assertEq(nft.owner(), owner);
    }

    // ============ Admin Management Tests ============

    function test_AddAdmin() public {
        vm.expectEmit(true, false, false, false);
        emit AdminAdded(admin);

        nft.addAdmin(admin);
        assertTrue(nft.isAdmin(admin));
    }

    function test_AddAdmin_RevertIfNotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        nft.addAdmin(admin);
    }

    function test_AddAdmin_RevertIfZeroAddress() public {
        vm.expectRevert(MortgagePositionNFT.ZeroAddress.selector);
        nft.addAdmin(address(0));
    }

    function test_RemoveAdmin() public {
        nft.addAdmin(admin);

        vm.expectEmit(true, false, false, false);
        emit AdminRemoved(admin);

        nft.removeAdmin(admin);
        assertFalse(nft.isAdmin(admin));
    }

    function test_RemoveAdmin_RevertIfNotOwner() public {
        nft.addAdmin(admin);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        nft.removeAdmin(admin);
    }

    // ============ Mint Position Tests ============

    function test_MintPosition() public {
        nft.addAdmin(factory);

        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(
            user,
            1,  // propertyId
            "ipfs://legal",
            400_000e6,  // principal
            100_000e6,  // downPayment
            500,  // rateBps (5%)
            12,   // termPeriods
            35_000e6  // paymentPerPeriod
        );

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(tokenId), user);
        assertEq(nft.totalPositions(), 1);
    }

    function test_MintPosition_EmitsEvent() public {
        nft.addAdmin(factory);

        vm.expectEmit(true, true, true, true);
        emit PositionCreated(0, user, 1, 400_000e6, 12);

        vm.prank(factory);
        nft.mintPosition(user, 1, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
    }

    function test_MintPosition_StoresCorrectData() public {
        nft.addAdmin(factory);

        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(
            user,
            1,
            "ipfs://legal",
            400_000e6,
            100_000e6,
            500,
            12,
            35_000e6
        );

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.factory, factory);
        assertEq(pos.propertyId, 1);
        assertEq(pos.legalContractURI, "ipfs://legal");
        assertEq(pos.principal, 400_000e6);
        assertEq(pos.downPayment, 100_000e6);
        assertEq(pos.rateBps, 500);
        assertEq(pos.termPeriods, 12);
        assertEq(pos.paymentPerPeriod, 35_000e6);
        assertEq(pos.remainingPrincipal, 400_000e6);
        assertEq(pos.totalPaid, 0);
        assertEq(pos.paymentsCompleted, 0);
        assertTrue(pos.isActive);
    }

    function test_MintPosition_RevertIfNotAdmin() public {
        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.NotAdmin.selector);
        nft.mintPosition(user, 1, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
    }

    function test_MintPosition_RevertIfZeroAddress() public {
        nft.addAdmin(factory);

        vm.prank(factory);
        vm.expectRevert(MortgagePositionNFT.ZeroAddress.selector);
        nft.mintPosition(address(0), 1, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
    }

    function test_MintPosition_TracksUserPositions() public {
        nft.addAdmin(factory);

        vm.startPrank(factory);
        uint256 tokenId1 = nft.mintPosition(user, 1, "ipfs://legal1", 400_000e6, 100_000e6, 500, 12, 35_000e6);
        uint256 tokenId2 = nft.mintPosition(user, 2, "ipfs://legal2", 600_000e6, 150_000e6, 500, 24, 30_000e6);
        vm.stopPrank();

        uint256[] memory positions = nft.getUserPositions(user);
        assertEq(positions.length, 2);
        assertEq(positions[0], tokenId1);
        assertEq(positions[1], tokenId2);
    }

    function test_MintPosition_IncrementsTokenId() public {
        nft.addAdmin(factory);

        vm.startPrank(factory);
        uint256 tokenId1 = nft.mintPosition(user, 1, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
        uint256 tokenId2 = nft.mintPosition(user2, 2, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
        vm.stopPrank();

        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
        assertEq(nft.totalPositions(), 2);
    }

    // ============ Record Payment Tests ============

    function _mintTestPosition() internal returns (uint256) {
        nft.addAdmin(factory);
        vm.prank(factory);
        return nft.mintPosition(user, 1, "ipfs://legal", 400_000e6, 100_000e6, 500, 12, 35_000e6);
    }

    function test_RecordPayment() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(factory);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, 1);
        assertEq(pos.totalPaid, 35_000e6);
        assertEq(pos.remainingPrincipal, 370_000e6);
    }

    function test_RecordPayment_EmitsEvent() public {
        uint256 tokenId = _mintTestPosition();

        vm.expectEmit(true, false, false, true);
        emit PaymentRecorded(tokenId, 35_000e6, 1, 370_000e6);

        vm.prank(factory);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);
    }

    function test_RecordPayment_StoresPaymentHistory() public {
        uint256 tokenId = _mintTestPosition();

        vm.warp(1000);
        vm.prank(factory);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);

        MortgagePositionNFT.Payment[] memory payments = nft.getPaymentHistory(tokenId);
        assertEq(payments.length, 1);
        assertEq(payments[0].amount, 35_000e6);
        assertEq(payments[0].timestamp, 1000);
        assertEq(payments[0].periodNumber, 1);
    }

    function test_RecordPayment_RevertIfNotFactory() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.NotFactory.selector);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);
    }

    function test_RecordPayment_RevertIfPositionNotActive() public {
        uint256 tokenId = _mintTestPosition();

        // Close position
        nft.closePosition(tokenId, "foreclosure");

        vm.prank(factory);
        vm.expectRevert(MortgagePositionNFT.PositionNotActive.selector);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);
    }

    function test_RecordPayment_RevertIfZeroAmount() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(factory);
        vm.expectRevert(MortgagePositionNFT.InvalidPayment.selector);
        nft.recordPayment(tokenId, 0, 0);
    }

    function test_RecordPayment_ClosesPositionWhenPaidOff() public {
        // Create position with small principal for easy testing
        nft.addAdmin(factory);
        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(user, 1, "ipfs://legal", 100e6, 20e6, 500, 2, 55e6);

        // Make first payment
        vm.prank(factory);
        nft.recordPayment(tokenId, 55e6, 50e6);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertTrue(pos.isActive);

        // Make second payment - should close position
        vm.expectEmit(true, false, false, true);
        emit PositionClosed(tokenId, "paid_off");

        vm.prank(factory);
        nft.recordPayment(tokenId, 55e6, 50e6);

        pos = nft.getPosition(tokenId);
        assertFalse(pos.isActive);
        assertTrue(nft.isPaidOff(tokenId));
    }

    function test_RecordPayment_ClosesWhenPrincipalZero() public {
        nft.addAdmin(factory);
        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(user, 1, "ipfs://legal", 100e6, 20e6, 500, 12, 10e6);

        // Pay off entire principal in one payment
        vm.prank(factory);
        nft.recordPayment(tokenId, 10e6, 100e6);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertFalse(pos.isActive);
        assertEq(pos.remainingPrincipal, 0);
    }

    // ============ Admin Transfer Tests ============

    function test_AdminTransfer() public {
        uint256 tokenId = _mintTestPosition();

        vm.expectEmit(true, true, true, true);
        emit PositionTransferred(tokenId, user, user2, "legal_transfer");

        nft.adminTransfer(tokenId, user2, "legal_transfer");

        assertEq(nft.ownerOf(tokenId), user2);
    }

    function test_AdminTransfer_UpdatesUserPositions() public {
        uint256 tokenId = _mintTestPosition();

        nft.adminTransfer(tokenId, user2, "legal_transfer");

        uint256[] memory userPositions = nft.getUserPositions(user);
        uint256[] memory user2Positions = nft.getUserPositions(user2);

        assertEq(userPositions.length, 0);
        assertEq(user2Positions.length, 1);
        assertEq(user2Positions[0], tokenId);
    }

    function test_AdminTransfer_RecordsPreviousPosition() public {
        uint256 tokenId = _mintTestPosition();

        vm.warp(5000);
        nft.adminTransfer(tokenId, user2, "foreclosure");

        MortgagePositionNFT.PreviousPosition[] memory previous = nft.getPreviousPositions(tokenId);
        assertEq(previous.length, 1);
        assertEq(previous[0].tokenId, tokenId);
        assertEq(previous[0].timestamp, 5000);
        assertEq(previous[0].reason, "foreclosure");
    }

    function test_AdminTransfer_RevertIfNotAdmin() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.NotAdmin.selector);
        nft.adminTransfer(tokenId, user2, "transfer");
    }

    function test_AdminTransfer_RevertIfZeroAddress() public {
        uint256 tokenId = _mintTestPosition();

        vm.expectRevert(MortgagePositionNFT.ZeroAddress.selector);
        nft.adminTransfer(tokenId, address(0), "transfer");
    }

    function test_AdminTransfer_RevertIfPositionNotFound() public {
        vm.expectRevert(MortgagePositionNFT.PositionNotFound.selector);
        nft.adminTransfer(999, user2, "transfer");
    }

    // ============ Close Position Tests ============

    function test_ClosePosition() public {
        uint256 tokenId = _mintTestPosition();

        vm.expectEmit(true, false, false, true);
        emit PositionClosed(tokenId, "foreclosure");

        nft.closePosition(tokenId, "foreclosure");

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertFalse(pos.isActive);
    }

    function test_ClosePosition_RevertIfNotAdmin() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.NotAdmin.selector);
        nft.closePosition(tokenId, "foreclosure");
    }

    function test_ClosePosition_RevertIfAlreadyClosed() public {
        uint256 tokenId = _mintTestPosition();

        nft.closePosition(tokenId, "foreclosure");

        vm.expectRevert(MortgagePositionNFT.PositionNotActive.selector);
        nft.closePosition(tokenId, "foreclosure");
    }

    // ============ Update Legal Contract Tests ============

    function test_UpdateLegalContract() public {
        uint256 tokenId = _mintTestPosition();

        vm.expectEmit(true, false, false, true);
        emit LegalContractUpdated(tokenId, "ipfs://newlegal");

        nft.updateLegalContract(tokenId, "ipfs://newlegal");

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.legalContractURI, "ipfs://newlegal");
    }

    function test_UpdateLegalContract_RevertIfNotAdmin() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.NotAdmin.selector);
        nft.updateLegalContract(tokenId, "ipfs://newlegal");
    }

    // ============ Soulbound Tests ============

    function test_Soulbound_CannotTransfer() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.TransferNotAllowed.selector);
        nft.transferFrom(user, user2, tokenId);
    }

    function test_Soulbound_CannotSafeTransfer() public {
        uint256 tokenId = _mintTestPosition();

        vm.prank(user);
        vm.expectRevert(MortgagePositionNFT.TransferNotAllowed.selector);
        nft.safeTransferFrom(user, user2, tokenId);
    }

    function test_Soulbound_AdminCanTransfer() public {
        uint256 tokenId = _mintTestPosition();

        // Admin can transfer via adminTransfer
        nft.adminTransfer(tokenId, user2, "legal_transfer");
        assertEq(nft.ownerOf(tokenId), user2);
    }

    // ============ View Functions Tests ============

    function test_GetPosition_RevertIfNotFound() public {
        vm.expectRevert(MortgagePositionNFT.PositionNotFound.selector);
        nft.getPosition(999);
    }

    function test_GetPaymentHistory_RevertIfNotFound() public {
        vm.expectRevert(MortgagePositionNFT.PositionNotFound.selector);
        nft.getPaymentHistory(999);
    }

    function test_GetPreviousPositions_RevertIfNotFound() public {
        vm.expectRevert(MortgagePositionNFT.PositionNotFound.selector);
        nft.getPreviousPositions(999);
    }

    function test_IsPaidOff() public {
        uint256 tokenId = _mintTestPosition();

        assertFalse(nft.isPaidOff(tokenId));

        // Make all payments
        vm.startPrank(factory);
        for (uint256 i = 0; i < 12; i++) {
            nft.recordPayment(tokenId, 35_000e6, 35_000e6);
        }
        vm.stopPrank();

        assertTrue(nft.isPaidOff(tokenId));
    }

    function test_GetRemainingPayments() public {
        uint256 tokenId = _mintTestPosition();

        assertEq(nft.getRemainingPayments(tokenId), 12);

        vm.prank(factory);
        nft.recordPayment(tokenId, 35_000e6, 30_000e6);

        assertEq(nft.getRemainingPayments(tokenId), 11);
    }

    function test_GetRemainingPayments_ReturnsZeroWhenComplete() public {
        nft.addAdmin(factory);
        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(user, 1, "ipfs://legal", 100e6, 20e6, 500, 2, 55e6);

        vm.startPrank(factory);
        nft.recordPayment(tokenId, 55e6, 50e6);
        nft.recordPayment(tokenId, 55e6, 50e6);
        vm.stopPrank();

        assertEq(nft.getRemainingPayments(tokenId), 0);
    }

    function test_GetUserPositions_EmptyForNewUser() public view {
        uint256[] memory positions = nft.getUserPositions(user);
        assertEq(positions.length, 0);
    }

    // ============ Fuzz Tests ============

    function testFuzz_MintPosition_ValidParams(
        uint256 propertyId,
        uint256 principal,
        uint256 downPayment,
        uint16 rateBps,
        uint8 termPeriods,
        uint256 paymentPerPeriod
    ) public {
        vm.assume(principal > 0 && principal < type(uint128).max);
        vm.assume(downPayment < type(uint128).max);
        vm.assume(termPeriods > 0);
        vm.assume(paymentPerPeriod > 0 && paymentPerPeriod < type(uint128).max);

        nft.addAdmin(factory);

        vm.prank(factory);
        uint256 tokenId = nft.mintPosition(
            user,
            propertyId,
            "ipfs://legal",
            principal,
            downPayment,
            rateBps,
            termPeriods,
            paymentPerPeriod
        );

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.principal, principal);
        assertEq(pos.downPayment, downPayment);
        assertEq(pos.rateBps, rateBps);
        assertEq(pos.termPeriods, termPeriods);
        assertEq(pos.paymentPerPeriod, paymentPerPeriod);
    }

    function testFuzz_RecordPayment_ValidAmount(uint128 amount, uint128 principalPaid) public {
        vm.assume(amount > 0);

        uint256 tokenId = _mintTestPosition();

        vm.prank(factory);
        nft.recordPayment(tokenId, amount, principalPaid);

        MortgagePositionNFT.Position memory pos = nft.getPosition(tokenId);
        assertEq(pos.paymentsCompleted, 1);
        assertEq(pos.totalPaid, amount);
    }
}
