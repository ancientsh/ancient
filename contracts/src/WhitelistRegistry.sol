// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WhitelistRegistry
 * @notice A soulbound registry that gates access to the Mortgage Factory
 * @dev Users cannot transfer their whitelist status. Admins grant or revoke
 *      access based on KYC/AML compliance and eligibility criteria.
 */
contract WhitelistRegistry is Ownable {
    /// @notice Whitelist status for a user
    struct WhitelistStatus {
        bool isWhitelisted;      // Whether user can access mortgage functions
        uint256 whitelistedAt;   // Timestamp when whitelisted (0 if never)
        uint256 revokedAt;       // Timestamp when revoked (0 if not revoked)
        string kycReference;     // Reference to off-chain KYC record (hash/ID)
    }

    /// @notice Mapping from user address to their whitelist status
    mapping(address => WhitelistStatus) private _statuses;

    /// @notice Mapping to track registered admins
    mapping(address => bool) public isAdmin;

    /// @notice Total count of currently whitelisted users
    uint256 public whitelistedCount;

    /// @notice Events
    event UserWhitelisted(address indexed user, string kycReference, uint256 timestamp);
    event UserRevoked(address indexed user, uint256 timestamp);
    event UserReinstated(address indexed user, uint256 timestamp);
    event KycReferenceUpdated(address indexed user, string newKycReference);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    /// @notice Errors
    error NotAdmin();
    error ZeroAddress();
    error AlreadyWhitelisted();
    error NotWhitelisted();
    error AlreadyRevoked();

    /// @notice Modifier to restrict access to admins or owner
    modifier onlyAdmin() {
        if (!isAdmin[msg.sender] && msg.sender != owner()) {
            revert NotAdmin();
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
        if (admin == address(0)) revert ZeroAddress();
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

    // ============ Whitelist Management ============

    /**
     * @notice Whitelist a user for mortgage access
     * @param user The address to whitelist
     * @param kycReference Reference to off-chain KYC documentation
     */
    function whitelistUser(address user, string calldata kycReference) external onlyAdmin {
        if (user == address(0)) revert ZeroAddress();

        WhitelistStatus storage status = _statuses[user];
        if (status.isWhitelisted) revert AlreadyWhitelisted();

        status.isWhitelisted = true;
        status.whitelistedAt = block.timestamp;
        status.revokedAt = 0;
        status.kycReference = kycReference;

        whitelistedCount++;

        emit UserWhitelisted(user, kycReference, block.timestamp);
    }

    /**
     * @notice Revoke a user's whitelist status
     * @param user The address to revoke
     */
    function revokeUser(address user) external onlyAdmin {
        WhitelistStatus storage status = _statuses[user];
        if (!status.isWhitelisted) revert NotWhitelisted();

        status.isWhitelisted = false;
        status.revokedAt = block.timestamp;

        whitelistedCount--;

        emit UserRevoked(user, block.timestamp);
    }

    /**
     * @notice Reinstate a previously revoked user
     * @param user The address to reinstate
     */
    function reinstateUser(address user) external onlyAdmin {
        WhitelistStatus storage status = _statuses[user];

        // User must have been whitelisted before (has a whitelistedAt timestamp)
        if (status.whitelistedAt == 0) revert NotWhitelisted();
        // User must currently be revoked
        if (status.isWhitelisted) revert AlreadyWhitelisted();

        status.isWhitelisted = true;
        status.revokedAt = 0;

        whitelistedCount++;

        emit UserReinstated(user, block.timestamp);
    }

    /**
     * @notice Update the KYC reference for a user
     * @param user The address to update
     * @param newKycReference The new KYC reference
     */
    function updateKycReference(address user, string calldata newKycReference) external onlyAdmin {
        WhitelistStatus storage status = _statuses[user];
        // User must have been whitelisted at some point
        if (status.whitelistedAt == 0) revert NotWhitelisted();

        status.kycReference = newKycReference;

        emit KycReferenceUpdated(user, newKycReference);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a user is currently whitelisted
     * @param user The address to check
     * @return whitelisted Whether the user is whitelisted
     */
    function isWhitelisted(address user) external view returns (bool whitelisted) {
        return _statuses[user].isWhitelisted;
    }

    /**
     * @notice Get the full whitelist status for a user
     * @param user The address to query
     * @return status The whitelist status struct
     */
    function getStatus(address user) external view returns (WhitelistStatus memory status) {
        return _statuses[user];
    }

    /**
     * @notice Get when a user was whitelisted
     * @param user The address to query
     * @return timestamp The whitelist timestamp (0 if never whitelisted)
     */
    function getWhitelistedAt(address user) external view returns (uint256 timestamp) {
        return _statuses[user].whitelistedAt;
    }

    /**
     * @notice Get when a user was revoked
     * @param user The address to query
     * @return timestamp The revocation timestamp (0 if not revoked)
     */
    function getRevokedAt(address user) external view returns (uint256 timestamp) {
        return _statuses[user].revokedAt;
    }

    /**
     * @notice Get the KYC reference for a user
     * @param user The address to query
     * @return kycRef The KYC reference string
     */
    function getKycReference(address user) external view returns (string memory kycRef) {
        return _statuses[user].kycReference;
    }
}
