// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PropertyOracle} from "./PropertyOracle.sol";
import {RateFormula} from "./RateFormula.sol";
import {WhitelistRegistry} from "./WhitelistRegistry.sol";
import {MortgagePositionNFT} from "./MortgagePositionNFT.sol";

/**
 * @title MortgageFactory
 * @notice Central hub for mortgage creation and treasury management
 * @dev Integrates PropertyOracle, RateFormula, WhitelistRegistry, and MortgagePositionNFT
 *      to enable mortgage origination and payment processing.
 */
contract MortgageFactory is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The payment token (MockUSD)
    IERC20 public immutable paymentToken;

    /// @notice The PropertyOracle contract
    PropertyOracle public immutable propertyOracle;

    /// @notice The RateFormula contract
    RateFormula public rateFormula;

    /// @notice The WhitelistRegistry contract
    WhitelistRegistry public immutable whitelistRegistry;

    /// @notice The MortgagePositionNFT contract
    MortgagePositionNFT public immutable positionNFT;

    /// @notice Treasury address where payments flow
    address public treasury;

    /// @notice Mapping to track registered admins
    mapping(address => bool) public isAdmin;

    /// @notice Events
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

    /// @notice Errors
    error NotAdmin();
    error NotWhitelisted();
    error PropertyNotFound();
    error PropertyNotActive();
    error InvalidDownPayment();
    error InvalidTermLength();
    error InsufficientDownPayment();
    error ZeroAddress();
    error PositionNotActive();
    error InsufficientPayment();
    error NotPositionOwner();

    /// @notice Modifier to restrict access to admins or owner
    modifier onlyAdmin() {
        if (!isAdmin[msg.sender] && msg.sender != owner()) {
            revert NotAdmin();
        }
        _;
    }

    /// @notice Modifier to require caller is whitelisted
    modifier onlyWhitelisted() {
        if (!whitelistRegistry.isWhitelisted(msg.sender)) {
            revert NotWhitelisted();
        }
        _;
    }

    constructor(
        address _paymentToken,
        address _propertyOracle,
        address _rateFormula,
        address _whitelistRegistry,
        address _positionNFT,
        address _treasury
    ) Ownable(msg.sender) {
        if (_paymentToken == address(0)) revert ZeroAddress();
        if (_propertyOracle == address(0)) revert ZeroAddress();
        if (_rateFormula == address(0)) revert ZeroAddress();
        if (_whitelistRegistry == address(0)) revert ZeroAddress();
        if (_positionNFT == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        paymentToken = IERC20(_paymentToken);
        propertyOracle = PropertyOracle(_propertyOracle);
        rateFormula = RateFormula(_rateFormula);
        whitelistRegistry = WhitelistRegistry(_whitelistRegistry);
        positionNFT = MortgagePositionNFT(_positionNFT);
        treasury = _treasury;

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

    /**
     * @notice Update the treasury address
     * @param newTreasury The new treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Update the rate formula contract (upgradeable)
     * @param newFormula The new rate formula contract address
     */
    function setRateFormula(address newFormula) external onlyOwner {
        if (newFormula == address(0)) revert ZeroAddress();
        address oldFormula = address(rateFormula);
        rateFormula = RateFormula(newFormula);
        emit RateFormulaUpdated(oldFormula, newFormula);
    }

    // ============ Mortgage Origination ============

    /**
     * @notice Create a new mortgage position
     * @dev Caller must be whitelisted, provide sufficient down payment, and meet term requirements
     * @param propertyId The property ID from PropertyOracle
     * @param downPaymentBps Down payment as basis points of property value (min 2000 = 20%)
     * @param termPeriods Number of payment periods (10-30)
     * @param legalContractURI URI of the legal housing agreement
     * @return tokenId The minted position NFT token ID
     */
    function createMortgage(
        uint256 propertyId,
        uint256 downPaymentBps,
        uint256 termPeriods,
        string calldata legalContractURI
    ) external onlyWhitelisted returns (uint256 tokenId) {
        // Validate property exists and is active
        PropertyOracle.Property memory property = propertyOracle.getProperty(propertyId);
        if (!property.isActive) revert PropertyNotActive();

        // Validate mortgage parameters via RateFormula
        if (!rateFormula.validateMortgageParams(downPaymentBps, termPeriods)) {
            if (downPaymentBps < rateFormula.MIN_DOWN_PAYMENT_BPS()) {
                revert InvalidDownPayment();
            }
            revert InvalidTermLength();
        }

        // Get payment schedule from RateFormula
        (
            uint256 principal,
            uint256 downPayment,
            uint256 rateBps,
            uint256 paymentPerPeriod,
            ,
        ) = rateFormula.getPaymentSchedule(property.currentValuation, downPaymentBps, termPeriods);

        // Transfer down payment from borrower to treasury
        paymentToken.safeTransferFrom(msg.sender, treasury, downPayment);

        // Mint the mortgage position NFT
        tokenId = positionNFT.mintPosition(
            msg.sender,
            propertyId,
            legalContractURI,
            principal,
            downPayment,
            rateBps,
            termPeriods,
            paymentPerPeriod
        );

        emit MortgageCreated(
            tokenId,
            msg.sender,
            propertyId,
            principal,
            downPayment,
            termPeriods
        );
    }

    // ============ Payment Processing ============

    /**
     * @notice Make a payment on a mortgage position
     * @dev Caller must own the position (or be making payment on behalf of owner)
     * @param tokenId The position token ID
     */
    function makePayment(uint256 tokenId) external {
        // Get position details
        MortgagePositionNFT.Position memory position = positionNFT.getPosition(tokenId);
        if (!position.isActive) revert PositionNotActive();

        // Verify caller owns the position
        if (positionNFT.ownerOf(tokenId) != msg.sender) revert NotPositionOwner();

        uint256 paymentAmount = position.paymentPerPeriod;

        // Calculate principal and interest portions
        // For simplicity in MVP: use straight-line principal allocation
        uint256 remainingPayments = position.termPeriods - position.paymentsCompleted;
        uint256 principalPaid;
        uint256 interestPaid;

        if (remainingPayments > 0) {
            // Calculate interest for this period
            // Interest = remaining principal * rate / BPS_DENOMINATOR
            uint256 periodInterest = (position.remainingPrincipal * position.rateBps) / rateFormula.BPS_DENOMINATOR();

            if (paymentAmount > periodInterest) {
                interestPaid = periodInterest;
                principalPaid = paymentAmount - periodInterest;
            } else {
                // Entire payment goes to interest (shouldn't happen with proper amortization)
                interestPaid = paymentAmount;
                principalPaid = 0;
            }

            // Cap principal paid at remaining principal
            if (principalPaid > position.remainingPrincipal) {
                principalPaid = position.remainingPrincipal;
            }
        }

        // Transfer payment from borrower to treasury
        paymentToken.safeTransferFrom(msg.sender, treasury, paymentAmount);

        // Record payment on the NFT
        positionNFT.recordPayment(tokenId, paymentAmount, principalPaid);

        emit PaymentMade(tokenId, msg.sender, paymentAmount, principalPaid, interestPaid);
    }

    /**
     * @notice Make multiple payments at once
     * @param tokenId The position token ID
     * @param numPayments Number of payments to make
     */
    function makeMultiplePayments(uint256 tokenId, uint256 numPayments) external {
        for (uint256 i = 0; i < numPayments; i++) {
            // Get fresh position data each iteration (state changes)
            MortgagePositionNFT.Position memory position = positionNFT.getPosition(tokenId);
            if (!position.isActive) break;

            if (positionNFT.ownerOf(tokenId) != msg.sender) revert NotPositionOwner();

            uint256 paymentAmount = position.paymentPerPeriod;
            uint256 remainingPayments = position.termPeriods - position.paymentsCompleted;
            uint256 principalPaid;
            uint256 interestPaid;

            if (remainingPayments > 0) {
                uint256 periodInterest = (position.remainingPrincipal * position.rateBps) / rateFormula.BPS_DENOMINATOR();

                if (paymentAmount > periodInterest) {
                    interestPaid = periodInterest;
                    principalPaid = paymentAmount - periodInterest;
                } else {
                    interestPaid = paymentAmount;
                    principalPaid = 0;
                }

                if (principalPaid > position.remainingPrincipal) {
                    principalPaid = position.remainingPrincipal;
                }
            }

            paymentToken.safeTransferFrom(msg.sender, treasury, paymentAmount);
            positionNFT.recordPayment(tokenId, paymentAmount, principalPaid);

            emit PaymentMade(tokenId, msg.sender, paymentAmount, principalPaid, interestPaid);
        }
    }

    /**
     * @notice Make a payment on behalf of position owner
     * @dev Allows third parties to make payments (e.g., family members, services)
     * @param tokenId The position token ID
     */
    function makePaymentFor(uint256 tokenId) external {
        MortgagePositionNFT.Position memory position = positionNFT.getPosition(tokenId);
        if (!position.isActive) revert PositionNotActive();

        uint256 paymentAmount = position.paymentPerPeriod;
        uint256 remainingPayments = position.termPeriods - position.paymentsCompleted;
        uint256 principalPaid;
        uint256 interestPaid;

        if (remainingPayments > 0) {
            uint256 periodInterest = (position.remainingPrincipal * position.rateBps) / rateFormula.BPS_DENOMINATOR();

            if (paymentAmount > periodInterest) {
                interestPaid = periodInterest;
                principalPaid = paymentAmount - periodInterest;
            } else {
                interestPaid = paymentAmount;
                principalPaid = 0;
            }

            if (principalPaid > position.remainingPrincipal) {
                principalPaid = position.remainingPrincipal;
            }
        }

        paymentToken.safeTransferFrom(msg.sender, treasury, paymentAmount);
        positionNFT.recordPayment(tokenId, paymentAmount, principalPaid);

        emit PaymentMade(tokenId, msg.sender, paymentAmount, principalPaid, interestPaid);
    }

    // ============ View Functions ============

    /**
     * @notice Get the next payment amount for a position
     * @param tokenId The position token ID
     * @return amount The payment amount due
     */
    function getPaymentAmount(uint256 tokenId) external view returns (uint256 amount) {
        MortgagePositionNFT.Position memory position = positionNFT.getPosition(tokenId);
        return position.paymentPerPeriod;
    }

    /**
     * @notice Check if a payment is overdue for a position
     * @param tokenId The position token ID
     * @return overdue Whether payment is overdue
     * @return periodsOverdue Number of periods overdue
     */
    function isPaymentOverdue(uint256 tokenId) external view returns (bool overdue, uint256 periodsOverdue) {
        MortgagePositionNFT.Position memory position = positionNFT.getPosition(tokenId);
        if (!position.isActive) return (false, 0);

        // Get payment history to find last payment timestamp
        MortgagePositionNFT.Payment[] memory payments = positionNFT.getPaymentHistory(tokenId);

        uint256 lastPaymentTime;
        if (payments.length == 0) {
            lastPaymentTime = position.createdAt;
        } else {
            lastPaymentTime = payments[payments.length - 1].timestamp;
        }

        return rateFormula.isPaymentOverdue(lastPaymentTime, block.timestamp);
    }

    /**
     * @notice Get mortgage preview without creating
     * @param propertyId The property ID
     * @param downPaymentBps Down payment in basis points
     * @param termPeriods Number of payment periods
     * @return principal Loan principal
     * @return downPayment Down payment amount
     * @return rateBps Interest rate
     * @return paymentPerPeriod Payment per period
     * @return totalPayment Total over loan life
     * @return totalInterest Total interest
     */
    function previewMortgage(
        uint256 propertyId,
        uint256 downPaymentBps,
        uint256 termPeriods
    )
        external
        view
        returns (
            uint256 principal,
            uint256 downPayment,
            uint256 rateBps,
            uint256 paymentPerPeriod,
            uint256 totalPayment,
            uint256 totalInterest
        )
    {
        uint256 propertyValue = propertyOracle.getCurrentValuation(propertyId);
        return rateFormula.getPaymentSchedule(propertyValue, downPaymentBps, termPeriods);
    }
}
