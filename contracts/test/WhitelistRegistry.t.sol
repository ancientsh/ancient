// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WhitelistRegistry} from "../src/WhitelistRegistry.sol";

contract WhitelistRegistryTest is Test {
    WhitelistRegistry public registry;

    address public owner = address(this);
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public nonAdmin = address(0x4);

    string constant KYC_REF_1 = "KYC-2024-001";
    string constant KYC_REF_2 = "KYC-2024-002";
    string constant KYC_REF_UPDATED = "KYC-2024-001-UPDATED";

    event UserWhitelisted(address indexed user, string kycReference, uint256 timestamp);
    event UserRevoked(address indexed user, uint256 timestamp);
    event UserReinstated(address indexed user, uint256 timestamp);
    event KycReferenceUpdated(address indexed user, string newKycReference);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    function setUp() public {
        registry = new WhitelistRegistry();
        registry.addAdmin(admin);
    }

    // ============ Constructor Tests ============

    function test_constructor_setsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function test_constructor_ownerIsAdmin() public view {
        assertTrue(registry.isAdmin(owner));
    }

    function test_constructor_initialWhitelistedCountZero() public view {
        assertEq(registry.whitelistedCount(), 0);
    }

    // ============ Admin Management Tests ============

    function test_addAdmin_success() public {
        address newAdmin = address(0x100);

        vm.expectEmit(true, false, false, false);
        emit AdminAdded(newAdmin);

        registry.addAdmin(newAdmin);
        assertTrue(registry.isAdmin(newAdmin));
    }

    function test_addAdmin_revertsIfNotOwner() public {
        vm.prank(nonAdmin);
        vm.expectRevert();
        registry.addAdmin(address(0x100));
    }

    function test_addAdmin_revertsIfZeroAddress() public {
        vm.expectRevert(WhitelistRegistry.ZeroAddress.selector);
        registry.addAdmin(address(0));
    }

    function test_removeAdmin_success() public {
        vm.expectEmit(true, false, false, false);
        emit AdminRemoved(admin);

        registry.removeAdmin(admin);
        assertFalse(registry.isAdmin(admin));
    }

    function test_removeAdmin_revertsIfNotOwner() public {
        vm.prank(nonAdmin);
        vm.expectRevert();
        registry.removeAdmin(admin);
    }

    // ============ Whitelist User Tests ============

    function test_whitelistUser_success() public {
        vm.expectEmit(true, false, false, true);
        emit UserWhitelisted(user1, KYC_REF_1, block.timestamp);

        registry.whitelistUser(user1, KYC_REF_1);

        assertTrue(registry.isWhitelisted(user1));
        assertEq(registry.whitelistedCount(), 1);
    }

    function test_whitelistUser_setsCorrectTimestamp() public {
        uint256 timestamp = 1000;
        vm.warp(timestamp);

        registry.whitelistUser(user1, KYC_REF_1);

        assertEq(registry.getWhitelistedAt(user1), timestamp);
    }

    function test_whitelistUser_setsKycReference() public {
        registry.whitelistUser(user1, KYC_REF_1);
        assertEq(registry.getKycReference(user1), KYC_REF_1);
    }

    function test_whitelistUser_adminCanWhitelist() public {
        vm.prank(admin);
        registry.whitelistUser(user1, KYC_REF_1);
        assertTrue(registry.isWhitelisted(user1));
    }

    function test_whitelistUser_revertsIfNotAdmin() public {
        vm.prank(nonAdmin);
        vm.expectRevert(WhitelistRegistry.NotAdmin.selector);
        registry.whitelistUser(user1, KYC_REF_1);
    }

    function test_whitelistUser_revertsIfZeroAddress() public {
        vm.expectRevert(WhitelistRegistry.ZeroAddress.selector);
        registry.whitelistUser(address(0), KYC_REF_1);
    }

    function test_whitelistUser_revertsIfAlreadyWhitelisted() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.expectRevert(WhitelistRegistry.AlreadyWhitelisted.selector);
        registry.whitelistUser(user1, KYC_REF_2);
    }

    function test_whitelistUser_incrementsCount() public {
        assertEq(registry.whitelistedCount(), 0);

        registry.whitelistUser(user1, KYC_REF_1);
        assertEq(registry.whitelistedCount(), 1);

        registry.whitelistUser(user2, KYC_REF_2);
        assertEq(registry.whitelistedCount(), 2);
    }

    // ============ Revoke User Tests ============

    function test_revokeUser_success() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.expectEmit(true, false, false, true);
        emit UserRevoked(user1, block.timestamp);

        registry.revokeUser(user1);

        assertFalse(registry.isWhitelisted(user1));
    }

    function test_revokeUser_setsRevokedAtTimestamp() public {
        registry.whitelistUser(user1, KYC_REF_1);

        uint256 revokeTime = 2000;
        vm.warp(revokeTime);

        registry.revokeUser(user1);

        assertEq(registry.getRevokedAt(user1), revokeTime);
    }

    function test_revokeUser_decrementsCount() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.whitelistUser(user2, KYC_REF_2);
        assertEq(registry.whitelistedCount(), 2);

        registry.revokeUser(user1);
        assertEq(registry.whitelistedCount(), 1);
    }

    function test_revokeUser_revertsIfNotWhitelisted() public {
        vm.expectRevert(WhitelistRegistry.NotWhitelisted.selector);
        registry.revokeUser(user1);
    }

    function test_revokeUser_revertsIfNotAdmin() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.prank(nonAdmin);
        vm.expectRevert(WhitelistRegistry.NotAdmin.selector);
        registry.revokeUser(user1);
    }

    function test_revokeUser_preservesWhitelistedAtTimestamp() public {
        uint256 whitelistTime = 1000;
        vm.warp(whitelistTime);
        registry.whitelistUser(user1, KYC_REF_1);

        vm.warp(2000);
        registry.revokeUser(user1);

        // Original whitelist timestamp should be preserved
        assertEq(registry.getWhitelistedAt(user1), whitelistTime);
    }

    // ============ Reinstate User Tests ============

    function test_reinstateUser_success() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.revokeUser(user1);

        vm.expectEmit(true, false, false, true);
        emit UserReinstated(user1, block.timestamp);

        registry.reinstateUser(user1);

        assertTrue(registry.isWhitelisted(user1));
    }

    function test_reinstateUser_clearsRevokedAt() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.revokeUser(user1);
        assertTrue(registry.getRevokedAt(user1) > 0);

        registry.reinstateUser(user1);

        assertEq(registry.getRevokedAt(user1), 0);
    }

    function test_reinstateUser_incrementsCount() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.revokeUser(user1);
        assertEq(registry.whitelistedCount(), 0);

        registry.reinstateUser(user1);
        assertEq(registry.whitelistedCount(), 1);
    }

    function test_reinstateUser_revertsIfNeverWhitelisted() public {
        vm.expectRevert(WhitelistRegistry.NotWhitelisted.selector);
        registry.reinstateUser(user1);
    }

    function test_reinstateUser_revertsIfCurrentlyWhitelisted() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.expectRevert(WhitelistRegistry.AlreadyWhitelisted.selector);
        registry.reinstateUser(user1);
    }

    function test_reinstateUser_revertsIfNotAdmin() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.revokeUser(user1);

        vm.prank(nonAdmin);
        vm.expectRevert(WhitelistRegistry.NotAdmin.selector);
        registry.reinstateUser(user1);
    }

    // ============ Update KYC Reference Tests ============

    function test_updateKycReference_success() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.expectEmit(true, false, false, true);
        emit KycReferenceUpdated(user1, KYC_REF_UPDATED);

        registry.updateKycReference(user1, KYC_REF_UPDATED);

        assertEq(registry.getKycReference(user1), KYC_REF_UPDATED);
    }

    function test_updateKycReference_worksForRevokedUser() public {
        registry.whitelistUser(user1, KYC_REF_1);
        registry.revokeUser(user1);

        // Should still be able to update KYC reference for revoked user
        registry.updateKycReference(user1, KYC_REF_UPDATED);
        assertEq(registry.getKycReference(user1), KYC_REF_UPDATED);
    }

    function test_updateKycReference_revertsIfNeverWhitelisted() public {
        vm.expectRevert(WhitelistRegistry.NotWhitelisted.selector);
        registry.updateKycReference(user1, KYC_REF_UPDATED);
    }

    function test_updateKycReference_revertsIfNotAdmin() public {
        registry.whitelistUser(user1, KYC_REF_1);

        vm.prank(nonAdmin);
        vm.expectRevert(WhitelistRegistry.NotAdmin.selector);
        registry.updateKycReference(user1, KYC_REF_UPDATED);
    }

    // ============ View Functions Tests ============

    function test_getStatus_returnsFullStatus() public {
        uint256 whitelistTime = 1000;
        vm.warp(whitelistTime);
        registry.whitelistUser(user1, KYC_REF_1);

        WhitelistRegistry.WhitelistStatus memory status = registry.getStatus(user1);

        assertTrue(status.isWhitelisted);
        assertEq(status.whitelistedAt, whitelistTime);
        assertEq(status.revokedAt, 0);
        assertEq(status.kycReference, KYC_REF_1);
    }

    function test_getStatus_afterRevocation() public {
        uint256 whitelistTime = 1000;
        vm.warp(whitelistTime);
        registry.whitelistUser(user1, KYC_REF_1);

        uint256 revokeTime = 2000;
        vm.warp(revokeTime);
        registry.revokeUser(user1);

        WhitelistRegistry.WhitelistStatus memory status = registry.getStatus(user1);

        assertFalse(status.isWhitelisted);
        assertEq(status.whitelistedAt, whitelistTime);
        assertEq(status.revokedAt, revokeTime);
        assertEq(status.kycReference, KYC_REF_1);
    }

    function test_isWhitelisted_returnsFalseForNonWhitelisted() public view {
        assertFalse(registry.isWhitelisted(user1));
    }

    // ============ Soulbound Property Tests ============

    function test_soulbound_statusCannotBeTransferred() public {
        // The whitelist status is stored per-address and cannot be transferred
        // This test verifies the design by checking that whitelisting one user
        // doesn't affect another user's status
        registry.whitelistUser(user1, KYC_REF_1);

        assertTrue(registry.isWhitelisted(user1));
        assertFalse(registry.isWhitelisted(user2));

        // There's no transfer function - status is bound to the address
    }

    // ============ Fuzz Tests ============

    function testFuzz_whitelistMultipleUsers(uint8 count) public {
        vm.assume(count > 0 && count <= 50);

        for (uint256 i = 0; i < count; i++) {
            address user = address(uint160(1000 + i));
            string memory kycRef = string(abi.encodePacked("KYC-", vm.toString(i)));
            registry.whitelistUser(user, kycRef);
        }

        assertEq(registry.whitelistedCount(), count);
    }

    function testFuzz_revokeDoesNotAffectOthers(uint8 whitelistCount) public {
        vm.assume(whitelistCount >= 2 && whitelistCount <= 20);

        // Whitelist multiple users
        for (uint256 i = 0; i < whitelistCount; i++) {
            address user = address(uint160(1000 + i));
            string memory kycRef = string(abi.encodePacked("KYC-", vm.toString(i)));
            registry.whitelistUser(user, kycRef);
        }

        // Revoke the first user
        address firstUser = address(uint160(1000));
        registry.revokeUser(firstUser);

        // All other users should still be whitelisted
        for (uint256 i = 1; i < whitelistCount; i++) {
            address user = address(uint160(1000 + i));
            assertTrue(registry.isWhitelisted(user));
        }

        assertEq(registry.whitelistedCount(), whitelistCount - 1);
    }
}
