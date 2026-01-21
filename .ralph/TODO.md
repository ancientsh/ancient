# Patterns

- OpenZeppelin v5 Ownable: Constructor requires `Ownable(msg.sender)` instead of empty constructor
- Admin pattern: Owner + separate admin mapping allows flexible role management
- Custom errors: Use `error Name()` over `require(cond, "msg")` for gas efficiency

---

# Tasks

## Smart Contracts (Foundry)
- [x] Task 1: Initialize Foundry project structure and configure foundry.toml
- [x] Task 2: Create MockUSD ERC20 token contract for testing payments
- [x] Task 3: Create PropertyOracle contract (property metadata, valuations, admin management)
- [x] Task 4: Create RateFormula contract (interest rate calculation, payment schedules)
- [x] Task 5: Create WhitelistRegistry contract (soulbound access control, KYC gating)
- [x] Task 6: Create MortgagePositionNFT contract (soulbound NFT with payment history)
- [x] Task 7: Create MortgageFactory contract (mortgage origination, treasury management)
- [x] Task 8: Write deployment script for local Anvil chain
- [x] Task 9: Write Foundry tests for all contracts

## Frontend
- [x] Task 10: Set up Web3 provider and contract ABIs for frontend
- [x] Task 11: Create Faucet page (get MockUSD test tokens)
- [x] Task 12: Create Dashboard page (view properties and user's mortgages)
- [x] Task 13: Create Mortgage page (create position, make payments)

---

# Notes

## Task 1: Initialize Foundry project structure - Done
- Initialized Foundry in `contracts/` directory
- Installed OpenZeppelin contracts v5.5.0 and forge-std v1.14.0
- Configured foundry.toml with Solidity 0.8.24, optimizer, and remappings
- Removed default Counter contracts
- Files changed: `contracts/foundry.toml`, removed Counter.sol/Counter.t.sol/Counter.s.sol
- **Learnings:**
  - Foundry's `forge install` no longer supports `--no-commit` flag
  - OpenZeppelin v5 uses different import paths than v4

## Task 2: Create MockUSD ERC20 token contract - Done
- Created `MockUSD.sol` with USDC-like 6 decimals
- Includes `faucet()` function that mints 10,000 mUSD to caller
- Includes `mint(address, uint256)` for flexible test setups
- Created comprehensive test file `MockUSD.t.sol` with 10 passing tests
- Files changed: `contracts/src/MockUSD.sol`, `contracts/test/MockUSD.t.sol`
- **Learnings:**
  - Use named imports `{ERC20}` instead of plain imports to avoid Foundry lint warnings
  - OpenZeppelin v5 ERC20 works seamlessly with Solidity 0.8.24

## Task 3: Create PropertyOracle contract - Done
- Created `PropertyOracle.sol` with property metadata and valuations
- Implemented admin management (owner + admins can register/update)
- Enforced immutability for location, originalValuation, and registeredAt fields
- Mutable fields: currentValuation, isActive, metadataURI
- Created comprehensive test file `PropertyOracle.t.sol` with 40 passing tests
- Files changed: `contracts/src/PropertyOracle.sol`, `contracts/test/PropertyOracle.t.sol`
- **Learnings:**
  - OpenZeppelin v5 Ownable requires passing owner address to constructor: `Ownable(msg.sender)`
  - Custom errors (e.g., `error NotAdmin()`) are more gas-efficient than require strings
  - Modifier pattern `propertyExists(propertyId)` keeps property ID validation DRY

## Task 4: Create RateFormula contract - Done
- Created `RateFormula.sol` with interest rate calculation and payment schedule logic
- Uses 1-minute payment intervals (`PAYMENT_INTERVAL = 60`) for MVP testing
- Enforces litepaper constraints: 20% min down payment, 10-30 period terms
- Implements standard amortization formula using fixed-point math (1e18 scaling)
- Key functions: `calculateRate`, `calculatePayment`, `getPaymentSchedule`, `isPaymentOverdue`
- Owner can update base rate via `setBaseRate` for market adaptation
- Created comprehensive test file `RateFormula.t.sol` with 53 passing tests (including fuzz tests)
- Files changed: `contracts/src/RateFormula.sol`, `contracts/test/RateFormula.t.sol`
- **Learnings:**
  - Amortization formula: P * [r(1+r)^n] / [(1+r)^n - 1] needs 1e18 scaling to avoid precision loss
  - Fuzz tests need bounded inputs to avoid overflow - realistic ranges (e.g., max $100T principal) prevent false failures
  - Using `this.functionName()` in external calls allows re-using public functions internally with proper ABI encoding

## Task 5: Create WhitelistRegistry contract - Done
- Created `WhitelistRegistry.sol` implementing soulbound access control for KYC gating
- WhitelistStatus struct tracks: isWhitelisted, whitelistedAt, revokedAt, kycReference
- Key functions: whitelistUser, revokeUser, reinstateUser, updateKycReference
- Maintains `whitelistedCount` for tracking active whitelisted users
- Status is non-transferable (soulbound) - bound to user's address
- Created comprehensive test file `WhitelistRegistry.t.sol` with 38 passing tests (including fuzz tests)
- Files changed: `contracts/src/WhitelistRegistry.sol`, `contracts/test/WhitelistRegistry.t.sol`
- **Learnings:**
  - Soulbound design: No transfer function means whitelist status is inherently address-bound
  - Separate whitelistedAt/revokedAt timestamps enable full audit trail of user status changes
  - Reinstate logic requires checking both "never whitelisted" and "currently whitelisted" states

## Task 6: Create MortgagePositionNFT contract - Done
- Created `MortgagePositionNFT.sol` implementing soulbound NFT for mortgage positions
- Position struct includes: factory, propertyId, legalContractURI, principal, downPayment, rateBps, termPeriods, paymentPerPeriod, createdAt, remainingPrincipal, totalPaid, paymentsCompleted, isActive
- Payment struct stores: amount, timestamp, periodNumber for full history
- PreviousPosition struct tracks refinancing/transfers with tokenId, timestamp, reason
- Soulbound via `_update` override - users cannot transfer, only admins via `adminTransfer`
- Key functions: mintPosition (admin-only), recordPayment (factory-only), adminTransfer, closePosition
- View functions: getPosition, getPaymentHistory, getPreviousPositions, getUserPositions, isPaidOff, getRemainingPayments
- Automatic position closure when paid off (remainingPrincipal=0 or paymentsCompleted>=termPeriods)
- Files changed: `contracts/src/MortgagePositionNFT.sol`
- **Learnings:**
  - ERC721 soulbound pattern: Override `_update` to check `isAdmin[msg.sender]` and block non-admin transfers
  - Factory-only pattern: Store factory address in position and check via `onlyFactory(tokenId)` modifier
  - User position tracking: Maintain `_userPositions` mapping for efficient lookup of user's NFTs

## Task 7: Create MortgageFactory contract - Done
- Created `MortgageFactory.sol` as central hub for mortgage origination and treasury management
- Integrates with PropertyOracle, RateFormula, WhitelistRegistry, MortgagePositionNFT, and MockUSD
- Key functions: `createMortgage` (whitelist-gated), `makePayment`, `makeMultiplePayments`, `makePaymentFor`
- Treasury address receives all down payments and periodic payments
- RateFormula is upgradeable via `setRateFormula` for market adaptation
- Implements payment flow with principal/interest split calculation
- View functions: `getPaymentAmount`, `isPaymentOverdue`, `previewMortgage`
- Fixed pre-existing test issue in PropertyOracle.t.sol (via_ir timestamp optimization)
- Files changed: `contracts/src/MortgageFactory.sol`, `contracts/foundry.toml` (enabled via_ir), `contracts/test/PropertyOracle.t.sol`
- **Learnings:**
  - Stack too deep error: Enable `via_ir = true` in foundry.toml when returning many values
  - SafeERC20: Use `safeTransferFrom` for robust token transfers
  - Integration pattern: Factory calls NFT's `recordPayment` after processing payment logic

## Task 8: Write deployment script for local Anvil chain - Done
- Created `contracts/script/Deploy.s.sol` with full deployment and setup
- Deployment order: MockUSD → PropertyOracle → RateFormula → WhitelistRegistry → MortgagePositionNFT → MortgageFactory
- Post-deployment config: Factory granted admin on NFT, 3 sample properties registered, deployer whitelisted
- Uses default Anvil account 0 private key or `PRIVATE_KEY` env var
- Treasury set to deployer address for simplicity
- Base rate configured at 500 bps (5%)
- Sample properties: $500K, $750K, $1M homes with realistic addresses
- Includes comprehensive console output with deployment summary
- Files changed: `contracts/script/Deploy.s.sol`
- **Learnings:**
  - Foundry scripts use `vm.startBroadcast(privateKey)` to sign transactions
  - `try vm.envUint()` pattern allows fallback to default values
  - Scripts without `--broadcast` run in simulation mode for testing

## Task 9: Write Foundry tests for all contracts - Done
- Created comprehensive test file `MortgagePositionNFT.t.sol` with 47 tests
- Created comprehensive test file `MortgageFactory.t.sol` with 41 tests
- All 6 test files now cover all 6 contracts (229 total tests passing)
- Tests include: constructor, admin management, core functions, edge cases, fuzz tests
- MortgageFactory tests include integration tests for full payment lifecycle
- Files changed: `contracts/test/MortgagePositionNFT.t.sol`, `contracts/test/MortgageFactory.t.sol`
- **Learnings:**
  - Integration tests need full contract setup: deploy all contracts, grant admin rights, register properties, whitelist users
  - ERC721 approval pattern: User must `approve(address(factory), type(uint256).max)` for token transfers
  - Lifecycle tests verify end-to-end flows: create mortgage → make payments → position closes automatically

## Task 10: Set up Web3 provider and contract ABIs for frontend - Done
- Installed viem for Web3 interaction (lightweight ethers alternative)
- Created `src/contracts/abis.ts` with all 6 contract ABIs extracted from Foundry build output
- Created `src/contracts/addresses.ts` with deterministic Anvil deployment addresses
- Created `src/contracts/client.ts` with viem client utilities (public/wallet clients, Anvil chain config)
- Created `src/contracts/Web3Provider.tsx` with React context for Web3 state management
- Created `src/contracts/index.ts` as central export hub
- Includes utility functions: formatUSD, parseUSD, formatBps, parseBps
- Auto-connects to first Anvil account on mount, supports account switching
- Files changed: `package.json`, `src/contracts/abis.ts`, `src/contracts/addresses.ts`, `src/contracts/client.ts`, `src/contracts/Web3Provider.tsx`, `src/contracts/index.ts`
- **Learnings:**
  - viem's getContract generic types are complex; using `any` for ContractInstances simplifies interface while preserving runtime typing
  - Deterministic Anvil addresses: contracts deploy to same addresses given same deployer nonce sequence
  - Anvil account 0 has private key `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## Task 11: Create Faucet page (get MockUSD test tokens) - Done
- Created `src/pages/Faucet.tsx` with full faucet functionality
- Displays connected account address and current mUSD balance
- Shows faucet amount per claim (10,000 mUSD)
- "Claim Test Tokens" button calls MockUSD.faucet() contract function
- Shows transaction hash on success, error message on failure
- Auto-refreshes balance after successful claim
- Updated `src/App.tsx` with navigation bar, account selector, and page routing
- Wrapped App with Web3Provider for global Web3 state
- Updated `src/index.css` to remove Bun template background animation
- Updated `src/index.html` title to "Ancient Protocol MVP"
- Files changed: `src/pages/Faucet.tsx`, `src/App.tsx`, `src/index.css`, `src/index.html`
- **Learnings:**
  - viem's sendTransaction requires explicit `chain` parameter when wallet client is configured
  - encodeFunctionData allows building transaction data for contract calls
  - useCallback with proper dependencies prevents infinite re-renders in useEffect

## Task 12: Create Dashboard page (view properties and user's mortgages) - Done
- Created `src/pages/Dashboard.tsx` with two sections: user's mortgages and available properties
- Fetches all properties from PropertyOracle using totalProperties() and getProperty()
- Fetches user's mortgage positions from MortgagePositionNFT using getUserPositions() and getPosition()
- PropertyCard component displays: location, current/original valuation, registration date, status
- PositionCard component displays: principal, remaining balance, interest rate, payment progress bar
- Progress bar shows visual indication of payment completion (paymentsCompleted / termPeriods)
- Status badges for positions: "Paid Off" (green), "Active" (blue), "Closed" (gray)
- Refresh buttons for both sections to reload data
- Handles loading states and empty states gracefully
- Updated `src/App.tsx` to import and render Dashboard component
- Files changed: `src/pages/Dashboard.tsx`, `src/App.tsx`
- **Learnings:**
  - Iterate over property/position IDs with loop since Solidity mappings can't be enumerated
  - Format dates from Unix timestamps using `new Date(Number(timestamp) * 1000)`
  - Progress calculation: `Number(paymentsCompleted) / Number(termPeriods) * 100`

## Task 13: Create Mortgage page (create position, make payments) - Done
- Created `src/pages/Mortgage.tsx` with two tabs: "Create Mortgage" and "Make Payments"
- **CreateMortgageForm** component:
  - Property selector dropdown with current valuations
  - Down payment percentage input (min 20%)
  - Term selector (10-30 periods)
  - Real-time mortgage preview showing: down payment, principal, interest rate, payment/period, total payment, total interest
  - Checks whitelist status before allowing mortgage creation
  - Token approval flow before mortgage creation
  - Balance check with link to Faucet if insufficient
- **MakePaymentsForm** component:
  - Position selector showing remaining balance and payment progress
  - Number of payments input (1 to remaining payments)
  - Shows total payment amount
  - Token approval flow for payment amount
  - Supports single payment (makePayment) and multiple payments (makeMultiplePayments)
  - Position list auto-refreshes after payment
- Both forms handle loading states, success messages (with tx hash), and error messages
- Updated `src/App.tsx` to import and render Mortgage component
- Files changed: `src/pages/Mortgage.tsx`, `src/App.tsx`
- **Learnings:**
  - Use `!!()` to coerce nullable boolean expressions for `disabled` prop
  - previewMortgage returns tuple, cast as `[bigint, bigint, ...]` for proper typing
  - Token approval pattern: approve before transfer-heavy operations (createMortgage, makePayment)
