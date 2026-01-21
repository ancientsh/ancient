// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyOracle
 * @notice A data layer that stores property metadata and valuations for mortgage origination
 * @dev Admins manage property listings. Immutable state (location, original valuation)
 *      cannot be altered post-registration. Only mutable fields can be updated.
 */
contract PropertyOracle is Ownable {
    /// @notice Property data structure
    struct Property {
        // Immutable fields (set once, never changed)
        string location;           // Physical address/location identifier
        uint256 originalValuation; // Initial property valuation in USD (6 decimals like MockUSD)
        uint256 registeredAt;      // Timestamp when property was registered
        // Mutable fields (can be updated by admin)
        uint256 currentValuation;  // Current market valuation (can be updated)
        bool isActive;             // Whether property is available for mortgages
        string metadataURI;        // IPFS/URI for additional property metadata
    }

    /// @notice Counter for generating unique property IDs
    uint256 private _nextPropertyId;

    /// @notice Mapping from property ID to property data
    mapping(uint256 => Property) private _properties;

    /// @notice Mapping to track registered admins
    mapping(address => bool) public isAdmin;

    /// @notice Events
    event PropertyRegistered(
        uint256 indexed propertyId,
        string location,
        uint256 originalValuation,
        uint256 registeredAt
    );
    event PropertyDeactivated(uint256 indexed propertyId);
    event PropertyReactivated(uint256 indexed propertyId);
    event ValuationUpdated(uint256 indexed propertyId, uint256 oldValuation, uint256 newValuation);
    event MetadataUpdated(uint256 indexed propertyId, string newMetadataURI);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    /// @notice Errors
    error NotAdmin();
    error PropertyNotFound();
    error PropertyNotActive();
    error InvalidValuation();
    error EmptyLocation();

    /// @notice Modifier to restrict access to admins or owner
    modifier onlyAdmin() {
        if (!isAdmin[msg.sender] && msg.sender != owner()) {
            revert NotAdmin();
        }
        _;
    }

    /// @notice Modifier to check property exists
    modifier propertyExists(uint256 propertyId) {
        if (propertyId >= _nextPropertyId) {
            revert PropertyNotFound();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        // Owner is automatically an admin
        isAdmin[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    // ============ Admin Management ============

    /**
     * @notice Add a new admin
     * @param admin The address to grant admin rights
     */
    function addAdmin(address admin) external onlyOwner {
        isAdmin[admin] = true;
        emit AdminAdded(admin);
    }

    /**
     * @notice Remove an admin
     * @param admin The address to revoke admin rights
     */
    function removeAdmin(address admin) external onlyOwner {
        isAdmin[admin] = false;
        emit AdminRemoved(admin);
    }

    // ============ Property Registration ============

    /**
     * @notice Register a new property
     * @param location The physical address/location (immutable after registration)
     * @param valuation The initial property valuation in USD (6 decimals)
     * @param metadataURI Optional URI for additional property metadata
     * @return propertyId The unique ID assigned to this property
     */
    function registerProperty(
        string calldata location,
        uint256 valuation,
        string calldata metadataURI
    ) external onlyAdmin returns (uint256 propertyId) {
        if (bytes(location).length == 0) {
            revert EmptyLocation();
        }
        if (valuation == 0) {
            revert InvalidValuation();
        }

        propertyId = _nextPropertyId++;

        _properties[propertyId] = Property({
            location: location,
            originalValuation: valuation,
            registeredAt: block.timestamp,
            currentValuation: valuation,
            isActive: true,
            metadataURI: metadataURI
        });

        emit PropertyRegistered(propertyId, location, valuation, block.timestamp);
    }

    // ============ Property Updates (Mutable Fields Only) ============

    /**
     * @notice Update the current valuation of a property
     * @param propertyId The property ID to update
     * @param newValuation The new valuation in USD (6 decimals)
     */
    function updateValuation(uint256 propertyId, uint256 newValuation)
        external
        onlyAdmin
        propertyExists(propertyId)
    {
        if (newValuation == 0) {
            revert InvalidValuation();
        }

        Property storage prop = _properties[propertyId];
        uint256 oldValuation = prop.currentValuation;
        prop.currentValuation = newValuation;

        emit ValuationUpdated(propertyId, oldValuation, newValuation);
    }

    /**
     * @notice Update the metadata URI of a property
     * @param propertyId The property ID to update
     * @param newMetadataURI The new metadata URI
     */
    function updateMetadata(uint256 propertyId, string calldata newMetadataURI)
        external
        onlyAdmin
        propertyExists(propertyId)
    {
        _properties[propertyId].metadataURI = newMetadataURI;
        emit MetadataUpdated(propertyId, newMetadataURI);
    }

    /**
     * @notice Deactivate a property (no longer available for mortgages)
     * @param propertyId The property ID to deactivate
     */
    function deactivateProperty(uint256 propertyId)
        external
        onlyAdmin
        propertyExists(propertyId)
    {
        _properties[propertyId].isActive = false;
        emit PropertyDeactivated(propertyId);
    }

    /**
     * @notice Reactivate a previously deactivated property
     * @param propertyId The property ID to reactivate
     */
    function reactivateProperty(uint256 propertyId)
        external
        onlyAdmin
        propertyExists(propertyId)
    {
        _properties[propertyId].isActive = true;
        emit PropertyReactivated(propertyId);
    }

    // ============ View Functions ============

    /**
     * @notice Get full property details
     * @param propertyId The property ID to query
     * @return property The property data
     */
    function getProperty(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (Property memory property)
    {
        return _properties[propertyId];
    }

    /**
     * @notice Get the current valuation of a property
     * @param propertyId The property ID to query
     * @return valuation The current valuation in USD (6 decimals)
     */
    function getCurrentValuation(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (uint256 valuation)
    {
        return _properties[propertyId].currentValuation;
    }

    /**
     * @notice Get the original valuation of a property (immutable)
     * @param propertyId The property ID to query
     * @return valuation The original valuation in USD (6 decimals)
     */
    function getOriginalValuation(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (uint256 valuation)
    {
        return _properties[propertyId].originalValuation;
    }

    /**
     * @notice Check if a property is active
     * @param propertyId The property ID to query
     * @return active Whether the property is active
     */
    function isPropertyActive(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (bool active)
    {
        return _properties[propertyId].isActive;
    }

    /**
     * @notice Get the total number of registered properties
     * @return count The total property count
     */
    function totalProperties() external view returns (uint256 count) {
        return _nextPropertyId;
    }
}
