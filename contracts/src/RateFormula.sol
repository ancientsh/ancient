// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RateFormula
 * @notice Calculates interest rates and payment schedules for mortgages
 * @dev Uses 1-minute payment intervals for MVP testing. Upgradeable by swapping
 *      the formula contract in the MortgageFactory.
 */
contract RateFormula is Ownable {
    /// @notice Basis points denominator (100% = 10000 bps)
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Payment interval in seconds (1 minute for MVP testing)
    uint256 public constant PAYMENT_INTERVAL = 60;

    /// @notice Minimum down payment percentage in basis points (20% = 2000 bps)
    uint256 public constant MIN_DOWN_PAYMENT_BPS = 2000;

    /// @notice Minimum term in payment periods (10 "years" = 10 periods for MVP)
    uint256 public constant MIN_TERM_PERIODS = 10;

    /// @notice Maximum term in payment periods (30 "years" = 30 periods for MVP)
    uint256 public constant MAX_TERM_PERIODS = 30;

    /// @notice Base annual interest rate in basis points (e.g., 500 = 5%)
    uint256 public baseRateBps;

    /// @notice Events
    event BaseRateUpdated(uint256 oldRate, uint256 newRate);

    /// @notice Errors
    error InvalidRate();
    error InvalidTermLength();
    error InvalidDownPayment();
    error InvalidPrincipal();

    constructor(uint256 _baseRateBps) Ownable(msg.sender) {
        if (_baseRateBps == 0 || _baseRateBps > BPS_DENOMINATOR) {
            revert InvalidRate();
        }
        baseRateBps = _baseRateBps;
        emit BaseRateUpdated(0, _baseRateBps);
    }

    /**
     * @notice Update the base interest rate
     * @param newRateBps New rate in basis points
     */
    function setBaseRate(uint256 newRateBps) external onlyOwner {
        if (newRateBps == 0 || newRateBps > BPS_DENOMINATOR) {
            revert InvalidRate();
        }
        uint256 oldRate = baseRateBps;
        baseRateBps = newRateBps;
        emit BaseRateUpdated(oldRate, newRateBps);
    }

    /**
     * @notice Calculate the interest rate for a mortgage
     * @dev Currently returns base rate. Can be extended for risk-based pricing.
     * @param principal The loan principal amount
     * @param downPaymentBps Down payment as basis points of property value
     * @param termPeriods Number of payment periods
     * @return rateBps The annual interest rate in basis points
     */
    function calculateRate(
        uint256 principal,
        uint256 downPaymentBps,
        uint256 termPeriods
    ) external view returns (uint256 rateBps) {
        // Validate inputs
        if (principal == 0) revert InvalidPrincipal();
        if (downPaymentBps < MIN_DOWN_PAYMENT_BPS) revert InvalidDownPayment();
        if (termPeriods < MIN_TERM_PERIODS || termPeriods > MAX_TERM_PERIODS) {
            revert InvalidTermLength();
        }

        // For MVP, return base rate. Future versions can implement:
        // - Risk-based adjustments based on down payment size
        // - Term-based adjustments (longer terms = higher rates)
        // - Market condition adjustments
        return baseRateBps;
    }

    /**
     * @notice Calculate the fixed payment amount per period
     * @dev Uses standard amortization formula: P * [r(1+r)^n] / [(1+r)^n - 1]
     *      where P = principal, r = periodic rate, n = number of periods
     * @param principal The loan principal amount
     * @param rateBps Annual interest rate in basis points
     * @param termPeriods Number of payment periods
     * @return payment The fixed payment amount per period
     */
    function calculatePayment(
        uint256 principal,
        uint256 rateBps,
        uint256 termPeriods
    ) external pure returns (uint256 payment) {
        if (principal == 0) revert InvalidPrincipal();
        if (termPeriods < MIN_TERM_PERIODS || termPeriods > MAX_TERM_PERIODS) {
            revert InvalidTermLength();
        }

        // If rate is 0, simple division
        if (rateBps == 0) {
            return principal / termPeriods;
        }

        // Calculate periodic rate (annual rate / periods per year)
        // For MVP with 1-minute intervals, we treat each period as a "year"
        // So periodic rate = annual rate
        uint256 periodicRateBps = rateBps;

        // Amortization calculation using fixed-point math
        // To avoid precision loss, we scale up by 1e18
        uint256 SCALE = 1e18;

        // r = periodicRateBps / BPS_DENOMINATOR (scaled)
        uint256 r = (periodicRateBps * SCALE) / BPS_DENOMINATOR;

        // (1 + r) scaled
        uint256 onePlusR = SCALE + r;

        // (1 + r)^n using iterative multiplication
        uint256 onePlusRPowN = SCALE;
        for (uint256 i = 0; i < termPeriods; i++) {
            onePlusRPowN = (onePlusRPowN * onePlusR) / SCALE;
        }

        // Numerator: P * r * (1+r)^n
        uint256 numerator = (principal * r * onePlusRPowN) / SCALE;

        // Denominator: (1+r)^n - 1
        uint256 denominator = onePlusRPowN - SCALE;

        // Avoid division by zero (shouldn't happen with valid inputs)
        if (denominator == 0) {
            return principal / termPeriods;
        }

        // Payment = numerator / denominator
        payment = numerator / denominator;
    }

    /**
     * @notice Calculate total payment over the life of the loan
     * @param paymentPerPeriod The fixed payment amount per period
     * @param termPeriods Number of payment periods
     * @return total The total amount to be paid
     */
    function calculateTotalPayment(
        uint256 paymentPerPeriod,
        uint256 termPeriods
    ) external pure returns (uint256 total) {
        return paymentPerPeriod * termPeriods;
    }

    /**
     * @notice Calculate total interest paid over the life of the loan
     * @param principal The loan principal amount
     * @param paymentPerPeriod The fixed payment amount per period
     * @param termPeriods Number of payment periods
     * @return interest The total interest to be paid
     */
    function calculateTotalInterest(
        uint256 principal,
        uint256 paymentPerPeriod,
        uint256 termPeriods
    ) external pure returns (uint256 interest) {
        uint256 totalPayment = paymentPerPeriod * termPeriods;
        if (totalPayment <= principal) {
            return 0;
        }
        return totalPayment - principal;
    }

    /**
     * @notice Get the payment schedule details for a mortgage
     * @param propertyValue The property value in USD (6 decimals)
     * @param downPaymentBps Down payment as basis points of property value
     * @param termPeriods Number of payment periods
     * @return principal The loan principal (property value - down payment)
     * @return downPayment The down payment amount
     * @return rateBps The interest rate in basis points
     * @return paymentPerPeriod The fixed payment per period
     * @return totalPayment Total amount to be paid over loan life
     * @return totalInterest Total interest over loan life
     */
    function getPaymentSchedule(
        uint256 propertyValue,
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
        // Validate inputs
        if (propertyValue == 0) revert InvalidPrincipal();
        if (downPaymentBps < MIN_DOWN_PAYMENT_BPS) revert InvalidDownPayment();
        if (termPeriods < MIN_TERM_PERIODS || termPeriods > MAX_TERM_PERIODS) {
            revert InvalidTermLength();
        }

        // Calculate down payment and principal
        downPayment = (propertyValue * downPaymentBps) / BPS_DENOMINATOR;
        principal = propertyValue - downPayment;

        // Get interest rate
        rateBps = this.calculateRate(principal, downPaymentBps, termPeriods);

        // Calculate payment per period
        paymentPerPeriod = this.calculatePayment(principal, rateBps, termPeriods);

        // Calculate totals
        totalPayment = paymentPerPeriod * termPeriods;
        totalInterest = totalPayment > principal ? totalPayment - principal : 0;
    }

    /**
     * @notice Validate mortgage parameters
     * @param downPaymentBps Down payment as basis points of property value
     * @param termPeriods Number of payment periods
     * @return valid Whether the parameters are valid
     */
    function validateMortgageParams(
        uint256 downPaymentBps,
        uint256 termPeriods
    ) external pure returns (bool valid) {
        return downPaymentBps >= MIN_DOWN_PAYMENT_BPS &&
               termPeriods >= MIN_TERM_PERIODS &&
               termPeriods <= MAX_TERM_PERIODS;
    }

    /**
     * @notice Get the next payment due timestamp
     * @param lastPaymentTimestamp Timestamp of the last payment (or mortgage start)
     * @return dueTimestamp The timestamp when the next payment is due
     */
    function getNextPaymentDue(uint256 lastPaymentTimestamp)
        external
        pure
        returns (uint256 dueTimestamp)
    {
        return lastPaymentTimestamp + PAYMENT_INTERVAL;
    }

    /**
     * @notice Check if a payment is overdue
     * @param lastPaymentTimestamp Timestamp of the last payment (or mortgage start)
     * @param currentTimestamp Current block timestamp
     * @return overdue Whether the payment is overdue
     * @return periodsOverdue Number of periods overdue
     */
    function isPaymentOverdue(
        uint256 lastPaymentTimestamp,
        uint256 currentTimestamp
    ) external pure returns (bool overdue, uint256 periodsOverdue) {
        if (currentTimestamp <= lastPaymentTimestamp + PAYMENT_INTERVAL) {
            return (false, 0);
        }
        uint256 elapsed = currentTimestamp - lastPaymentTimestamp;
        periodsOverdue = elapsed / PAYMENT_INTERVAL;
        overdue = periodsOverdue > 0;
    }
}
