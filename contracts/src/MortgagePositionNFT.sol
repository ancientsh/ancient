// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MortgagePositionNFT
 * @notice Soulbound NFT representing a user's mortgage position with payment history
 * @dev Non-transferable by holder but can be reassigned by admins (legal transfer, foreclosure).
 *      Each NFT stores mortgage terms, payment history, and links to previous positions.
 */
contract MortgagePositionNFT is ERC721, Ownable {
    /// @notice Payment record structure
    struct Payment {
        uint256 amount;       // Payment amount in MockUSD (6 decimals)
        uint256 timestamp;    // Block timestamp when payment was made
        uint256 periodNumber; // Which period this payment covers
    }

    /// @notice Mortgage position data structure
    struct Position {
        // Factory and oracle references
        address factory;           // MortgageFactory that created this position
        uint256 propertyId;        // Property ID from PropertyOracle
        // Legal binding
        string legalContractURI;   // Hash or URI of off-chain housing agreement
        // Loan parameters (immutable after creation)
        uint256 principal;         // Loan principal amount (property value - down payment)
        uint256 downPayment;       // Initial capital committed
        uint256 rateBps;           // Interest rate in basis points
        uint256 termPeriods;       // Total number of payment periods
        uint256 paymentPerPeriod;  // Fixed payment amount per period
        // Position state
        uint256 createdAt;         // Timestamp when position was created
        uint256 remainingPrincipal; // Outstanding principal balance
        uint256 totalPaid;         // Total amount paid to date
        uint256 paymentsCompleted; // Number of payments made
        bool isActive;             // Whether the mortgage is active (not paid off/foreclosed)
    }

    /// @notice Previous position reference (for refinancing, transfers)
    struct PreviousPosition {
        uint256 tokenId;     // Previous NFT token ID
        uint256 timestamp;   // When the transition happened
        string reason;       // Reason for transition (refinance, transfer, etc.)
    }

    /// @notice Counter for generating unique token IDs
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to position data
    mapping(uint256 => Position) private _positions;

    /// @notice Mapping from token ID to payment history
    mapping(uint256 => Payment[]) private _paymentHistory;

    /// @notice Mapping from token ID to previous positions
    mapping(uint256 => PreviousPosition[]) private _previousPositions;

    /// @notice Mapping to track registered admins (can reassign NFTs)
    mapping(address => bool) public isAdmin;

    /// @notice Mapping from user to their active position token IDs
    mapping(address => uint256[]) private _userPositions;

    /// @notice Events
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

    /// @notice Errors
    error NotAdmin();
    error NotFactory();
    error PositionNotFound();
    error PositionNotActive();
    error TransferNotAllowed();
    error InvalidPayment();
    error ZeroAddress();

    /// @notice Modifier to restrict access to admins or owner
    modifier onlyAdmin() {
        if (!isAdmin[msg.sender] && msg.sender != owner()) {
            revert NotAdmin();
        }
        _;
    }

    /// @notice Modifier to restrict access to the factory that created the position
    modifier onlyFactory(uint256 tokenId) {
        if (msg.sender != _positions[tokenId].factory) {
            revert NotFactory();
        }
        _;
    }

    /// @notice Modifier to check position exists
    modifier positionExists(uint256 tokenId) {
        if (tokenId >= _nextTokenId) {
            revert PositionNotFound();
        }
        _;
    }

    constructor() ERC721("Ancient Mortgage Position", "AMP") Ownable(msg.sender) {
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

    // ============ Position Creation (Called by Factory) ============

    /**
     * @notice Mint a new mortgage position NFT
     * @dev Only callable by authorized factories (admins can authorize)
     * @param to The address to mint the NFT to
     * @param propertyId Property ID from PropertyOracle
     * @param legalContractURI URI of the legal housing agreement
     * @param principal Loan principal amount
     * @param downPayment Down payment amount
     * @param rateBps Interest rate in basis points
     * @param termPeriods Number of payment periods
     * @param paymentPerPeriod Fixed payment per period
     * @return tokenId The minted token ID
     */
    function mintPosition(
        address to,
        uint256 propertyId,
        string calldata legalContractURI,
        uint256 principal,
        uint256 downPayment,
        uint256 rateBps,
        uint256 termPeriods,
        uint256 paymentPerPeriod
    ) external onlyAdmin returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();

        tokenId = _nextTokenId++;

        _positions[tokenId] = Position({
            factory: msg.sender,
            propertyId: propertyId,
            legalContractURI: legalContractURI,
            principal: principal,
            downPayment: downPayment,
            rateBps: rateBps,
            termPeriods: termPeriods,
            paymentPerPeriod: paymentPerPeriod,
            createdAt: block.timestamp,
            remainingPrincipal: principal,
            totalPaid: 0,
            paymentsCompleted: 0,
            isActive: true
        });

        _userPositions[to].push(tokenId);
        _mint(to, tokenId);

        emit PositionCreated(tokenId, to, propertyId, principal, termPeriods);
    }

    // ============ Payment Recording ============

    /**
     * @notice Record a payment for a mortgage position
     * @dev Only callable by the factory that created this position
     * @param tokenId The position token ID
     * @param amount The payment amount
     * @param principalPaid Amount of the payment that goes to principal
     */
    function recordPayment(
        uint256 tokenId,
        uint256 amount,
        uint256 principalPaid
    ) external positionExists(tokenId) onlyFactory(tokenId) {
        Position storage pos = _positions[tokenId];
        if (!pos.isActive) revert PositionNotActive();
        if (amount == 0) revert InvalidPayment();

        pos.paymentsCompleted++;
        pos.totalPaid += amount;

        // Reduce remaining principal
        if (principalPaid >= pos.remainingPrincipal) {
            pos.remainingPrincipal = 0;
        } else {
            pos.remainingPrincipal -= principalPaid;
        }

        // Record payment in history
        _paymentHistory[tokenId].push(Payment({
            amount: amount,
            timestamp: block.timestamp,
            periodNumber: pos.paymentsCompleted
        }));

        emit PaymentRecorded(tokenId, amount, pos.paymentsCompleted, pos.remainingPrincipal);

        // Check if mortgage is paid off
        if (pos.remainingPrincipal == 0 || pos.paymentsCompleted >= pos.termPeriods) {
            pos.isActive = false;
            emit PositionClosed(tokenId, "paid_off");
        }
    }

    // ============ Admin Operations ============

    /**
     * @notice Transfer NFT ownership (admin only - for legal transfer, foreclosure)
     * @param tokenId The position token ID
     * @param to The new owner address
     * @param reason Reason for transfer (e.g., "legal_transfer", "foreclosure")
     */
    function adminTransfer(
        uint256 tokenId,
        address to,
        string calldata reason
    ) external positionExists(tokenId) onlyAdmin {
        if (to == address(0)) revert ZeroAddress();

        address from = ownerOf(tokenId);

        // Remove from previous owner's positions
        _removeUserPosition(from, tokenId);

        // Add to new owner's positions
        _userPositions[to].push(tokenId);

        // Record previous position reference
        _previousPositions[tokenId].push(PreviousPosition({
            tokenId: tokenId,
            timestamp: block.timestamp,
            reason: reason
        }));

        // Perform the transfer (bypassing soulbound restriction)
        _transfer(from, to, tokenId);

        emit PositionTransferred(tokenId, from, to, reason);
    }

    /**
     * @notice Close a position (admin only - for foreclosure or other reasons)
     * @param tokenId The position token ID
     * @param reason Reason for closing
     */
    function closePosition(
        uint256 tokenId,
        string calldata reason
    ) external positionExists(tokenId) onlyAdmin {
        Position storage pos = _positions[tokenId];
        if (!pos.isActive) revert PositionNotActive();

        pos.isActive = false;
        emit PositionClosed(tokenId, reason);
    }

    /**
     * @notice Update legal contract URI
     * @param tokenId The position token ID
     * @param newURI The new legal contract URI
     */
    function updateLegalContract(
        uint256 tokenId,
        string calldata newURI
    ) external positionExists(tokenId) onlyAdmin {
        _positions[tokenId].legalContractURI = newURI;
        emit LegalContractUpdated(tokenId, newURI);
    }

    // ============ View Functions ============

    /**
     * @notice Get full position details
     * @param tokenId The position token ID
     * @return position The position data
     */
    function getPosition(uint256 tokenId)
        external
        view
        positionExists(tokenId)
        returns (Position memory position)
    {
        return _positions[tokenId];
    }

    /**
     * @notice Get payment history for a position
     * @param tokenId The position token ID
     * @return payments Array of payment records
     */
    function getPaymentHistory(uint256 tokenId)
        external
        view
        positionExists(tokenId)
        returns (Payment[] memory payments)
    {
        return _paymentHistory[tokenId];
    }

    /**
     * @notice Get previous position references
     * @param tokenId The position token ID
     * @return previous Array of previous position references
     */
    function getPreviousPositions(uint256 tokenId)
        external
        view
        positionExists(tokenId)
        returns (PreviousPosition[] memory previous)
    {
        return _previousPositions[tokenId];
    }

    /**
     * @notice Get all position token IDs owned by an address
     * @param user The address to query
     * @return tokenIds Array of token IDs
     */
    function getUserPositions(address user)
        external
        view
        returns (uint256[] memory tokenIds)
    {
        return _userPositions[user];
    }

    /**
     * @notice Get the total number of positions minted
     * @return count The total position count
     */
    function totalPositions() external view returns (uint256 count) {
        return _nextTokenId;
    }

    /**
     * @notice Check if a position is paid off
     * @param tokenId The position token ID
     * @return paidOff Whether the position is paid off
     */
    function isPaidOff(uint256 tokenId)
        external
        view
        positionExists(tokenId)
        returns (bool paidOff)
    {
        Position storage pos = _positions[tokenId];
        return pos.remainingPrincipal == 0 || pos.paymentsCompleted >= pos.termPeriods;
    }

    /**
     * @notice Get remaining payments count
     * @param tokenId The position token ID
     * @return remaining Number of payments remaining
     */
    function getRemainingPayments(uint256 tokenId)
        external
        view
        positionExists(tokenId)
        returns (uint256 remaining)
    {
        Position storage pos = _positions[tokenId];
        if (pos.paymentsCompleted >= pos.termPeriods) {
            return 0;
        }
        return pos.termPeriods - pos.paymentsCompleted;
    }

    // ============ Soulbound Override ============

    /**
     * @dev Override transfer to make NFTs soulbound (non-transferable by holder)
     *      Only admins can transfer via adminTransfer function
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        // Allow admin transfers (when called via adminTransfer, auth will be admin)
        // Block regular transfers
        if (from != address(0) && !isAdmin[msg.sender] && msg.sender != owner()) {
            revert TransferNotAllowed();
        }

        return super._update(to, tokenId, auth);
    }

    // ============ Internal Helpers ============

    /**
     * @dev Remove a token ID from user's position array
     */
    function _removeUserPosition(address user, uint256 tokenId) internal {
        uint256[] storage positions = _userPositions[user];
        for (uint256 i = 0; i < positions.length; i++) {
            if (positions[i] == tokenId) {
                positions[i] = positions[positions.length - 1];
                positions.pop();
                break;
            }
        }
    }
}
