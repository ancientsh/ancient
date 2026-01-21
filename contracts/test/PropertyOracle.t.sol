// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PropertyOracle} from "../src/PropertyOracle.sol";

contract PropertyOracleTest is Test {
    PropertyOracle public oracle;
    address public owner = address(this);
    address public admin = address(0x1);
    address public user = address(0x2);

    uint256 constant VALUATION = 500_000 * 10 ** 6; // $500,000 with 6 decimals
    string constant LOCATION = "123 Main St, Miami, FL 33101";
    string constant METADATA_URI = "ipfs://QmPropertyMetadata123";

    function setUp() public {
        oracle = new PropertyOracle();
    }

    // ============ Constructor Tests ============

    function test_OwnerIsAdmin() public view {
        assertTrue(oracle.isAdmin(owner));
    }

    function test_OwnerIsOwner() public view {
        assertEq(oracle.owner(), owner);
    }

    function test_InitialTotalPropertiesIsZero() public view {
        assertEq(oracle.totalProperties(), 0);
    }

    // ============ Admin Management Tests ============

    function test_AddAdmin() public {
        oracle.addAdmin(admin);
        assertTrue(oracle.isAdmin(admin));
    }

    function test_AddAdminEmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit PropertyOracle.AdminAdded(admin);
        oracle.addAdmin(admin);
    }

    function test_RemoveAdmin() public {
        oracle.addAdmin(admin);
        oracle.removeAdmin(admin);
        assertFalse(oracle.isAdmin(admin));
    }

    function test_RemoveAdminEmitsEvent() public {
        oracle.addAdmin(admin);
        vm.expectEmit(true, false, false, false);
        emit PropertyOracle.AdminRemoved(admin);
        oracle.removeAdmin(admin);
    }

    function test_OnlyOwnerCanAddAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.addAdmin(admin);
    }

    function test_OnlyOwnerCanRemoveAdmin() public {
        oracle.addAdmin(admin);
        vm.prank(user);
        vm.expectRevert();
        oracle.removeAdmin(admin);
    }

    // ============ Property Registration Tests ============

    function test_RegisterProperty() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        assertEq(propertyId, 0);
        assertEq(oracle.totalProperties(), 1);
    }

    function test_RegisterPropertyReturnsIncrementingIds() public {
        uint256 id1 = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        uint256 id2 = oracle.registerProperty("456 Oak Ave", VALUATION, "");
        uint256 id3 = oracle.registerProperty("789 Pine Rd", VALUATION, "");

        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(id3, 2);
        assertEq(oracle.totalProperties(), 3);
    }

    function test_RegisterPropertySetsAllFields() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        PropertyOracle.Property memory prop = oracle.getProperty(propertyId);

        assertEq(prop.location, LOCATION);
        assertEq(prop.originalValuation, VALUATION);
        assertEq(prop.currentValuation, VALUATION);
        assertEq(prop.registeredAt, block.timestamp);
        assertTrue(prop.isActive);
        assertEq(prop.metadataURI, METADATA_URI);
    }

    function test_RegisterPropertyEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit PropertyOracle.PropertyRegistered(0, LOCATION, VALUATION, block.timestamp);
        oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
    }

    function test_AdminCanRegisterProperty() public {
        oracle.addAdmin(admin);
        vm.prank(admin);
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        assertEq(propertyId, 0);
    }

    function test_NonAdminCannotRegisterProperty() public {
        vm.prank(user);
        vm.expectRevert(PropertyOracle.NotAdmin.selector);
        oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
    }

    function test_CannotRegisterWithEmptyLocation() public {
        vm.expectRevert(PropertyOracle.EmptyLocation.selector);
        oracle.registerProperty("", VALUATION, METADATA_URI);
    }

    function test_CannotRegisterWithZeroValuation() public {
        vm.expectRevert(PropertyOracle.InvalidValuation.selector);
        oracle.registerProperty(LOCATION, 0, METADATA_URI);
    }

    function test_CanRegisterWithEmptyMetadata() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, "");
        PropertyOracle.Property memory prop = oracle.getProperty(propertyId);
        assertEq(prop.metadataURI, "");
    }

    // ============ Update Valuation Tests ============

    function test_UpdateValuation() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        uint256 newValuation = 600_000 * 10 ** 6;

        oracle.updateValuation(propertyId, newValuation);

        assertEq(oracle.getCurrentValuation(propertyId), newValuation);
        // Original valuation should remain unchanged
        assertEq(oracle.getOriginalValuation(propertyId), VALUATION);
    }

    function test_UpdateValuationEmitsEvent() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        uint256 newValuation = 600_000 * 10 ** 6;

        vm.expectEmit(true, false, false, true);
        emit PropertyOracle.ValuationUpdated(propertyId, VALUATION, newValuation);
        oracle.updateValuation(propertyId, newValuation);
    }

    function test_AdminCanUpdateValuation() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        oracle.addAdmin(admin);

        vm.prank(admin);
        oracle.updateValuation(propertyId, 600_000 * 10 ** 6);

        assertEq(oracle.getCurrentValuation(propertyId), 600_000 * 10 ** 6);
    }

    function test_NonAdminCannotUpdateValuation() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        vm.prank(user);
        vm.expectRevert(PropertyOracle.NotAdmin.selector);
        oracle.updateValuation(propertyId, 600_000 * 10 ** 6);
    }

    function test_CannotUpdateValuationToZero() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        vm.expectRevert(PropertyOracle.InvalidValuation.selector);
        oracle.updateValuation(propertyId, 0);
    }

    function test_CannotUpdateValuationOfNonexistentProperty() public {
        vm.expectRevert(PropertyOracle.PropertyNotFound.selector);
        oracle.updateValuation(999, 600_000 * 10 ** 6);
    }

    // ============ Update Metadata Tests ============

    function test_UpdateMetadata() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        string memory newURI = "ipfs://QmNewMetadata456";

        oracle.updateMetadata(propertyId, newURI);

        PropertyOracle.Property memory prop = oracle.getProperty(propertyId);
        assertEq(prop.metadataURI, newURI);
    }

    function test_UpdateMetadataEmitsEvent() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        string memory newURI = "ipfs://QmNewMetadata456";

        vm.expectEmit(true, false, false, true);
        emit PropertyOracle.MetadataUpdated(propertyId, newURI);
        oracle.updateMetadata(propertyId, newURI);
    }

    function test_NonAdminCannotUpdateMetadata() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        vm.prank(user);
        vm.expectRevert(PropertyOracle.NotAdmin.selector);
        oracle.updateMetadata(propertyId, "new");
    }

    // ============ Deactivate/Reactivate Tests ============

    function test_DeactivateProperty() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        oracle.deactivateProperty(propertyId);

        assertFalse(oracle.isPropertyActive(propertyId));
    }

    function test_DeactivatePropertyEmitsEvent() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        vm.expectEmit(true, false, false, false);
        emit PropertyOracle.PropertyDeactivated(propertyId);
        oracle.deactivateProperty(propertyId);
    }

    function test_ReactivateProperty() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        oracle.deactivateProperty(propertyId);

        oracle.reactivateProperty(propertyId);

        assertTrue(oracle.isPropertyActive(propertyId));
    }

    function test_ReactivatePropertyEmitsEvent() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        oracle.deactivateProperty(propertyId);

        vm.expectEmit(true, false, false, false);
        emit PropertyOracle.PropertyReactivated(propertyId);
        oracle.reactivateProperty(propertyId);
    }

    function test_NonAdminCannotDeactivate() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        vm.prank(user);
        vm.expectRevert(PropertyOracle.NotAdmin.selector);
        oracle.deactivateProperty(propertyId);
    }

    function test_NonAdminCannotReactivate() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);
        oracle.deactivateProperty(propertyId);

        vm.prank(user);
        vm.expectRevert(PropertyOracle.NotAdmin.selector);
        oracle.reactivateProperty(propertyId);
    }

    // ============ View Function Tests ============

    function test_GetPropertyNotFound() public {
        vm.expectRevert(PropertyOracle.PropertyNotFound.selector);
        oracle.getProperty(999);
    }

    function test_GetCurrentValuationNotFound() public {
        vm.expectRevert(PropertyOracle.PropertyNotFound.selector);
        oracle.getCurrentValuation(999);
    }

    function test_GetOriginalValuationNotFound() public {
        vm.expectRevert(PropertyOracle.PropertyNotFound.selector);
        oracle.getOriginalValuation(999);
    }

    function test_IsPropertyActiveNotFound() public {
        vm.expectRevert(PropertyOracle.PropertyNotFound.selector);
        oracle.isPropertyActive(999);
    }

    // ============ Immutability Tests ============

    function test_OriginalValuationRemainsImmutable() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        // Update current valuation multiple times
        oracle.updateValuation(propertyId, 600_000 * 10 ** 6);
        oracle.updateValuation(propertyId, 400_000 * 10 ** 6);
        oracle.updateValuation(propertyId, 700_000 * 10 ** 6);

        // Original valuation should never change
        assertEq(oracle.getOriginalValuation(propertyId), VALUATION);
    }

    function test_LocationRemainsImmutable() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        // Update other fields
        oracle.updateValuation(propertyId, 600_000 * 10 ** 6);
        oracle.updateMetadata(propertyId, "new-uri");
        oracle.deactivateProperty(propertyId);
        oracle.reactivateProperty(propertyId);

        // Location should remain the same
        PropertyOracle.Property memory prop = oracle.getProperty(propertyId);
        assertEq(prop.location, LOCATION);
    }

    function test_RegisteredAtRemainsImmutable() public {
        uint256 propertyId = oracle.registerProperty(LOCATION, VALUATION, METADATA_URI);

        // Get the registered timestamp right after creation
        PropertyOracle.Property memory propBefore = oracle.getProperty(propertyId);
        uint256 originalRegisteredAt = propBefore.registeredAt;

        // Warp time forward
        vm.warp(block.timestamp + 365 days);

        // Update other fields
        oracle.updateValuation(propertyId, 600_000 * 10 ** 6);

        // RegisteredAt should remain the same
        PropertyOracle.Property memory propAfter = oracle.getProperty(propertyId);
        assertEq(propAfter.registeredAt, originalRegisteredAt);
    }
}
