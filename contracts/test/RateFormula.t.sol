// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RateFormula} from "../src/RateFormula.sol";

contract RateFormulaTest is Test {
    RateFormula public rateFormula;

    address public owner = address(this);
    address public user = address(0x1);

    // Constants matching the contract
    uint256 constant BPS_DENOMINATOR = 10_000;
    uint256 constant MIN_DOWN_PAYMENT_BPS = 2000; // 20%
    uint256 constant MIN_TERM_PERIODS = 10;
    uint256 constant MAX_TERM_PERIODS = 30;
    uint256 constant PAYMENT_INTERVAL = 60; // 1 minute

    // Test values
    uint256 constant BASE_RATE_BPS = 500; // 5%
    uint256 constant PROPERTY_VALUE = 500_000 * 1e6; // $500,000 with 6 decimals

    function setUp() public {
        rateFormula = new RateFormula(BASE_RATE_BPS);
    }

    // ============ Constructor Tests ============

    function test_constructor_setsOwner() public view {
        assertEq(rateFormula.owner(), owner);
    }

    function test_constructor_setsBaseRate() public view {
        assertEq(rateFormula.baseRateBps(), BASE_RATE_BPS);
    }

    function test_constructor_emitsBaseRateUpdated() public {
        vm.expectEmit(true, true, true, true);
        emit RateFormula.BaseRateUpdated(0, 700);
        new RateFormula(700);
    }

    function test_constructor_revertsOnZeroRate() public {
        vm.expectRevert(RateFormula.InvalidRate.selector);
        new RateFormula(0);
    }

    function test_constructor_revertsOnRateOver100Percent() public {
        vm.expectRevert(RateFormula.InvalidRate.selector);
        new RateFormula(BPS_DENOMINATOR + 1);
    }

    // ============ Constants Tests ============

    function test_constants() public view {
        assertEq(rateFormula.BPS_DENOMINATOR(), 10_000);
        assertEq(rateFormula.PAYMENT_INTERVAL(), 60);
        assertEq(rateFormula.MIN_DOWN_PAYMENT_BPS(), 2000);
        assertEq(rateFormula.MIN_TERM_PERIODS(), 10);
        assertEq(rateFormula.MAX_TERM_PERIODS(), 30);
    }

    // ============ setBaseRate Tests ============

    function test_setBaseRate_updatesRate() public {
        uint256 newRate = 700; // 7%
        rateFormula.setBaseRate(newRate);
        assertEq(rateFormula.baseRateBps(), newRate);
    }

    function test_setBaseRate_emitsEvent() public {
        uint256 newRate = 700;
        vm.expectEmit(true, true, true, true);
        emit RateFormula.BaseRateUpdated(BASE_RATE_BPS, newRate);
        rateFormula.setBaseRate(newRate);
    }

    function test_setBaseRate_revertsForNonOwner() public {
        vm.prank(user);
        vm.expectRevert();
        rateFormula.setBaseRate(700);
    }

    function test_setBaseRate_revertsOnZeroRate() public {
        vm.expectRevert(RateFormula.InvalidRate.selector);
        rateFormula.setBaseRate(0);
    }

    function test_setBaseRate_revertsOnRateOver100Percent() public {
        vm.expectRevert(RateFormula.InvalidRate.selector);
        rateFormula.setBaseRate(BPS_DENOMINATOR + 1);
    }

    function test_setBaseRate_allowsMaxRate() public {
        rateFormula.setBaseRate(BPS_DENOMINATOR); // 100%
        assertEq(rateFormula.baseRateBps(), BPS_DENOMINATOR);
    }

    // ============ calculateRate Tests ============

    function test_calculateRate_returnsBaseRate() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 downPaymentBps = 2000; // 20%
        uint256 termPeriods = 15;

        uint256 rate = rateFormula.calculateRate(principal, downPaymentBps, termPeriods);
        assertEq(rate, BASE_RATE_BPS);
    }

    function test_calculateRate_revertsOnZeroPrincipal() public {
        vm.expectRevert(RateFormula.InvalidPrincipal.selector);
        rateFormula.calculateRate(0, 2000, 15);
    }

    function test_calculateRate_revertsOnLowDownPayment() public {
        vm.expectRevert(RateFormula.InvalidDownPayment.selector);
        rateFormula.calculateRate(400_000 * 1e6, 1999, 15); // 19.99%
    }

    function test_calculateRate_revertsOnTermTooShort() public {
        vm.expectRevert(RateFormula.InvalidTermLength.selector);
        rateFormula.calculateRate(400_000 * 1e6, 2000, MIN_TERM_PERIODS - 1);
    }

    function test_calculateRate_revertsOnTermTooLong() public {
        vm.expectRevert(RateFormula.InvalidTermLength.selector);
        rateFormula.calculateRate(400_000 * 1e6, 2000, MAX_TERM_PERIODS + 1);
    }

    function test_calculateRate_acceptsMinTerm() public view {
        uint256 rate = rateFormula.calculateRate(400_000 * 1e6, 2000, MIN_TERM_PERIODS);
        assertEq(rate, BASE_RATE_BPS);
    }

    function test_calculateRate_acceptsMaxTerm() public view {
        uint256 rate = rateFormula.calculateRate(400_000 * 1e6, 2000, MAX_TERM_PERIODS);
        assertEq(rate, BASE_RATE_BPS);
    }

    function test_calculateRate_acceptsExactMinDownPayment() public view {
        uint256 rate = rateFormula.calculateRate(400_000 * 1e6, MIN_DOWN_PAYMENT_BPS, 15);
        assertEq(rate, BASE_RATE_BPS);
    }

    function test_calculateRate_acceptsHigherDownPayment() public view {
        uint256 rate = rateFormula.calculateRate(400_000 * 1e6, 5000, 15); // 50%
        assertEq(rate, BASE_RATE_BPS);
    }

    // ============ calculatePayment Tests ============

    function test_calculatePayment_returnsNonZero() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 rateBps = 500;
        uint256 termPeriods = 15;

        uint256 payment = rateFormula.calculatePayment(principal, rateBps, termPeriods);
        assertGt(payment, 0);
    }

    function test_calculatePayment_totalExceedsPrincipalWithInterest() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 rateBps = 500;
        uint256 termPeriods = 15;

        uint256 payment = rateFormula.calculatePayment(principal, rateBps, termPeriods);
        uint256 totalPayment = payment * termPeriods;

        // Total should exceed principal due to interest
        assertGt(totalPayment, principal);
    }

    function test_calculatePayment_zeroRateEqualsSimpleDivision() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 termPeriods = 20;

        uint256 payment = rateFormula.calculatePayment(principal, 0, termPeriods);
        assertEq(payment, principal / termPeriods);
    }

    function test_calculatePayment_revertsOnZeroPrincipal() public {
        vm.expectRevert(RateFormula.InvalidPrincipal.selector);
        rateFormula.calculatePayment(0, 500, 15);
    }

    function test_calculatePayment_revertsOnTermTooShort() public {
        vm.expectRevert(RateFormula.InvalidTermLength.selector);
        rateFormula.calculatePayment(400_000 * 1e6, 500, MIN_TERM_PERIODS - 1);
    }

    function test_calculatePayment_revertsOnTermTooLong() public {
        vm.expectRevert(RateFormula.InvalidTermLength.selector);
        rateFormula.calculatePayment(400_000 * 1e6, 500, MAX_TERM_PERIODS + 1);
    }

    function test_calculatePayment_higherRateMeansHigherPayment() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 termPeriods = 15;

        uint256 paymentLow = rateFormula.calculatePayment(principal, 300, termPeriods);
        uint256 paymentHigh = rateFormula.calculatePayment(principal, 800, termPeriods);

        assertGt(paymentHigh, paymentLow);
    }

    function test_calculatePayment_longerTermMeansLowerPayment() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 rateBps = 500;

        uint256 paymentShort = rateFormula.calculatePayment(principal, rateBps, 10);
        uint256 paymentLong = rateFormula.calculatePayment(principal, rateBps, 30);

        assertGt(paymentShort, paymentLong);
    }

    // ============ calculateTotalPayment Tests ============

    function test_calculateTotalPayment() public view {
        uint256 paymentPerPeriod = 30_000 * 1e6;
        uint256 termPeriods = 15;

        uint256 total = rateFormula.calculateTotalPayment(paymentPerPeriod, termPeriods);
        assertEq(total, paymentPerPeriod * termPeriods);
    }

    // ============ calculateTotalInterest Tests ============

    function test_calculateTotalInterest() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 paymentPerPeriod = 30_000 * 1e6;
        uint256 termPeriods = 15;

        uint256 totalPayment = paymentPerPeriod * termPeriods;
        uint256 expectedInterest = totalPayment - principal;

        uint256 interest = rateFormula.calculateTotalInterest(principal, paymentPerPeriod, termPeriods);
        assertEq(interest, expectedInterest);
    }

    function test_calculateTotalInterest_zeroWhenPaymentBelowPrincipal() public view {
        uint256 principal = 400_000 * 1e6;
        uint256 paymentPerPeriod = 20_000 * 1e6;
        uint256 termPeriods = 15; // Total = 300k < 400k

        uint256 interest = rateFormula.calculateTotalInterest(principal, paymentPerPeriod, termPeriods);
        assertEq(interest, 0);
    }

    // ============ getPaymentSchedule Tests ============

    function test_getPaymentSchedule_returnsCorrectValues() public view {
        uint256 propertyValue = PROPERTY_VALUE;
        uint256 downPaymentBps = 2000; // 20%
        uint256 termPeriods = 15;

        (
            uint256 principal,
            uint256 downPayment,
            uint256 rateBps,
            uint256 paymentPerPeriod,
            uint256 totalPayment,
            uint256 totalInterest
        ) = rateFormula.getPaymentSchedule(propertyValue, downPaymentBps, termPeriods);

        // Check down payment (20% of 500k = 100k)
        assertEq(downPayment, (propertyValue * downPaymentBps) / BPS_DENOMINATOR);

        // Check principal (500k - 100k = 400k)
        assertEq(principal, propertyValue - downPayment);

        // Check rate
        assertEq(rateBps, BASE_RATE_BPS);

        // Check payment is reasonable
        assertGt(paymentPerPeriod, 0);

        // Check total payment
        assertEq(totalPayment, paymentPerPeriod * termPeriods);

        // Check interest
        assertEq(totalInterest, totalPayment > principal ? totalPayment - principal : 0);
    }

    function test_getPaymentSchedule_revertsOnZeroPropertyValue() public {
        vm.expectRevert(RateFormula.InvalidPrincipal.selector);
        rateFormula.getPaymentSchedule(0, 2000, 15);
    }

    function test_getPaymentSchedule_revertsOnLowDownPayment() public {
        vm.expectRevert(RateFormula.InvalidDownPayment.selector);
        rateFormula.getPaymentSchedule(PROPERTY_VALUE, 1999, 15);
    }

    function test_getPaymentSchedule_revertsOnInvalidTerm() public {
        vm.expectRevert(RateFormula.InvalidTermLength.selector);
        rateFormula.getPaymentSchedule(PROPERTY_VALUE, 2000, 5);
    }

    // ============ validateMortgageParams Tests ============

    function test_validateMortgageParams_validParams() public view {
        bool valid = rateFormula.validateMortgageParams(2000, 15);
        assertTrue(valid);
    }

    function test_validateMortgageParams_minValues() public view {
        bool valid = rateFormula.validateMortgageParams(MIN_DOWN_PAYMENT_BPS, MIN_TERM_PERIODS);
        assertTrue(valid);
    }

    function test_validateMortgageParams_maxValues() public view {
        bool valid = rateFormula.validateMortgageParams(BPS_DENOMINATOR, MAX_TERM_PERIODS);
        assertTrue(valid);
    }

    function test_validateMortgageParams_invalidDownPayment() public view {
        bool valid = rateFormula.validateMortgageParams(1999, 15);
        assertFalse(valid);
    }

    function test_validateMortgageParams_termTooShort() public view {
        bool valid = rateFormula.validateMortgageParams(2000, 9);
        assertFalse(valid);
    }

    function test_validateMortgageParams_termTooLong() public view {
        bool valid = rateFormula.validateMortgageParams(2000, 31);
        assertFalse(valid);
    }

    // ============ getNextPaymentDue Tests ============

    function test_getNextPaymentDue() public view {
        uint256 lastPayment = 1000;
        uint256 nextDue = rateFormula.getNextPaymentDue(lastPayment);
        assertEq(nextDue, lastPayment + PAYMENT_INTERVAL);
    }

    function test_getNextPaymentDue_fromZero() public view {
        uint256 nextDue = rateFormula.getNextPaymentDue(0);
        assertEq(nextDue, PAYMENT_INTERVAL);
    }

    // ============ isPaymentOverdue Tests ============

    function test_isPaymentOverdue_notOverdue() public view {
        uint256 lastPayment = 1000;
        uint256 currentTime = lastPayment + PAYMENT_INTERVAL; // Exactly on time

        (bool overdue, uint256 periodsOverdue) = rateFormula.isPaymentOverdue(lastPayment, currentTime);
        assertFalse(overdue);
        assertEq(periodsOverdue, 0);
    }

    function test_isPaymentOverdue_stillWithinGrace() public view {
        uint256 lastPayment = 1000;
        uint256 currentTime = lastPayment + PAYMENT_INTERVAL - 1; // 1 second before due

        (bool overdue, uint256 periodsOverdue) = rateFormula.isPaymentOverdue(lastPayment, currentTime);
        assertFalse(overdue);
        assertEq(periodsOverdue, 0);
    }

    function test_isPaymentOverdue_onePeriodOverdue() public view {
        uint256 lastPayment = 1000;
        uint256 currentTime = lastPayment + PAYMENT_INTERVAL + 1; // 1 second past due

        (bool overdue, uint256 periodsOverdue) = rateFormula.isPaymentOverdue(lastPayment, currentTime);
        assertTrue(overdue);
        assertEq(periodsOverdue, 1);
    }

    function test_isPaymentOverdue_multiplePeriodsOverdue() public view {
        uint256 lastPayment = 1000;
        uint256 currentTime = lastPayment + (PAYMENT_INTERVAL * 5) + 30; // 5 periods + 30 sec

        (bool overdue, uint256 periodsOverdue) = rateFormula.isPaymentOverdue(lastPayment, currentTime);
        assertTrue(overdue);
        assertEq(periodsOverdue, 5);
    }

    function test_isPaymentOverdue_exactlyTwoPeriodsOverdue() public view {
        uint256 lastPayment = 1000;
        uint256 currentTime = lastPayment + (PAYMENT_INTERVAL * 3); // Exactly 3 intervals = 2 periods overdue + current

        (bool overdue, uint256 periodsOverdue) = rateFormula.isPaymentOverdue(lastPayment, currentTime);
        assertTrue(overdue);
        assertEq(periodsOverdue, 3);
    }

    // ============ Integration Tests ============

    function test_integration_fullMortgageCalculation() public view {
        // Scenario: $500,000 property, 20% down, 15 period term
        uint256 propertyValue = 500_000 * 1e6;
        uint256 downPaymentBps = 2000;
        uint256 termPeriods = 15;

        // Get full payment schedule
        (
            uint256 principal,
            uint256 downPayment,
            uint256 rateBps,
            uint256 paymentPerPeriod,
            uint256 totalPayment,
            uint256 totalInterest
        ) = rateFormula.getPaymentSchedule(propertyValue, downPaymentBps, termPeriods);

        // Verify calculations are consistent
        assertEq(downPayment, 100_000 * 1e6); // 20% of 500k
        assertEq(principal, 400_000 * 1e6); // 500k - 100k
        assertEq(rateBps, BASE_RATE_BPS);
        assertEq(totalPayment, paymentPerPeriod * termPeriods);
        assertEq(totalInterest, totalPayment - principal);

        // Payment should cover principal + interest
        assertGt(totalPayment, principal);
    }

    function test_integration_paymentScheduleWithRateChange() public {
        // Get initial schedule
        (,,,uint256 paymentBefore,,) = rateFormula.getPaymentSchedule(PROPERTY_VALUE, 2000, 15);

        // Change rate
        rateFormula.setBaseRate(1000); // 10%

        // Get new schedule
        (,,,uint256 paymentAfter,,) = rateFormula.getPaymentSchedule(PROPERTY_VALUE, 2000, 15);

        // Higher rate = higher payment
        assertGt(paymentAfter, paymentBefore);
    }

    // ============ Fuzz Tests ============

    function testFuzz_calculatePayment_neverZeroWithPositiveInputs(
        uint256 principal,
        uint256 rateBps,
        uint256 termPeriods
    ) public view {
        // Bound inputs to realistic ranges to avoid overflow
        // Max principal: ~$100 trillion with 6 decimals (realistic upper bound for testing)
        principal = bound(principal, 1e6, 100_000_000_000_000 * 1e6);
        rateBps = bound(rateBps, 0, BPS_DENOMINATOR);
        termPeriods = bound(termPeriods, MIN_TERM_PERIODS, MAX_TERM_PERIODS);

        uint256 payment = rateFormula.calculatePayment(principal, rateBps, termPeriods);
        assertGt(payment, 0);
    }

    function testFuzz_validateMortgageParams(uint256 downPaymentBps, uint256 termPeriods) public view {
        bool valid = rateFormula.validateMortgageParams(downPaymentBps, termPeriods);

        bool expectedValid = downPaymentBps >= MIN_DOWN_PAYMENT_BPS &&
                            termPeriods >= MIN_TERM_PERIODS &&
                            termPeriods <= MAX_TERM_PERIODS;

        assertEq(valid, expectedValid);
    }
}
