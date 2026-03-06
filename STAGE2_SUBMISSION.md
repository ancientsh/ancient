# Stage 2 — MVP Submission: Ancient Protocol

## 1. GitHub Repository

**Repository URL:** https://github.com/ancientsh/ancient

---

## 2. Technical Documentation

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Bun runtime (replacing Node.js for faster development and production builds)
- Tailwind CSS v4 for styling
- LiquidCN UI component library
- Swiper for carousel interactions
- Viem for Ethereum contract interactions

**Backend/Server:**
- Bun.serve() for lightweight HTTP server
- RPC proxy forwarding to Anvil (local Ethereum testnet)

**Smart Contracts:**
- Solidity 0.8.24
- Foundry (Forge) for development, testing, and deployment
- OpenZeppelin contracts for access control and ERC20 utilities

**Blockchain Infrastructure:**
- Anvil (local Ethereum testnet)
- MockUSD (ERC20 stablecoin for testing)
- Custom mortgage protocol contracts

### Architectural Decisions

1. **Bun over Node.js**: Chose Bun for its superior performance, native TypeScript support, built-in bundler, and simplified dependency management. This eliminates the need for separate build tools like webpack or esbuild.

2. **Monorepo Structure**: Frontend and smart contracts coexist in a single repository for streamlined development, with clear separation between `src/` (frontend) and `contracts/` (Solidity).

3. **RPC Proxy Pattern**: Instead of direct blockchain connections, the app routes JSON-RPC requests through a server-side proxy. This enables:
   - CORS handling for browser compatibility
   - Centralized RPC endpoint management
   - Future extensibility for rate limiting and caching

4. **Component-Based UI**: Modular React components organized by feature (properties, mortgage, sections) enable reusability and maintainability.

5. **NFT-Backed Mortgage Positions**: Each mortgage is minted as an NFT, enabling:
   - Clear ownership semantics
   - Potential secondary market functionality
   - Composable DeFi integrations

### Implementation Approach

The MVP focuses on demonstrating the core mortgage lifecycle:
1. Users acquire test tokens via faucet
2. Users create mortgages with configurable down payments and terms
3. Users make payments against their mortgage positions
4. All state is tracked on-chain via smart contracts

---

## 3. Architecture Design Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Landing   │  │    Faucet    │  │   Dashboard  │           │
│  │    Page     │  │     Page     │  │    Page      │           │
│  └─────────────┘  └──────────────┘  └──────────────┘           │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │ Web3Provider │                              │
│                    │   (viem)     │                              │
│                    └──────┬──────┘                               │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP JSON-RPC
┌───────────────────────────▼──────────────────────────────────────┐
│                      Bun Server (RPC Proxy)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Forwards RPC requests to Anvil                          │   │
│  │  Handles CORS, health checks                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────────┘
                            │ JSON-RPC
┌───────────────────────────▼──────────────────────────────────────┐
│                      Anvil (Local Testnet)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Smart Contracts                        │   │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌─────────────┐ │   │
│  │  │  MockUSD     │  │ MortgageFactory │  │PropertyOracle│ │   │
│  │  │  (ERC20)     │  │  (Main Logic)   │  │ (Data Layer)│ │   │
│  │  └──────────────┘  └─────────────────┘  └─────────────┘ │   │
│  │  ┌──────────────────┐  ┌─────────────────┐  ┌──────────┐│   │
│  │  │RateFormula       │  │WhitelistRegistry│  │PositionNFT││   │
│  │  │(Amortization)    │  │(Access Control) │  │(ERC721)  ││   │
│  │  └──────────────────┘  └─────────────────┘  └──────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### On-Chain Logic

| Contract | Responsibility |
|----------|----------------|
| `MockUSD.sol` | ERC20 stablecoin with faucet for test tokens |
| `PropertyOracle.sol` | Stores property data (valuations, metadata URIs, active status) |
| `WhitelistRegistry.sol` | Manages approved borrowers (KYC/AML simulation) |
| `RateFormula.sol` | Pure contract for mortgage calculations (interest rates, amortization schedules) |
| `MortgagePositionNFT.sol` | ERC721 NFT representing mortgage positions with payment tracking |
| `MortgageFactory.sol` | Central hub for mortgage creation and payment processing |

### Off-Chain Logic

| Component | Responsibility |
|-----------|----------------|
| Bun Server | HTTP server, RPC proxy, static file serving |
| React Frontend | UI rendering, user interactions, wallet management |
| Web3Provider | Ethereum provider abstraction, account switching |
| Property Swiper | Property browsing with metadata fetched from IPFS-style URIs |

### Data Flow

1. **User connects wallet** → Frontend detects Anvil chain, loads accounts
2. **User claims tokens** → `MockUSD.faucet()` mints tokens to user
3. **User creates mortgage** → Frontend calls `MortgageFactory.createMortgage()` → transfers down payment → mints NFT
4. **User makes payment** → Frontend calls `MortgageFactory.makePayment()` → transfers payment → updates NFT state
5. **UI updates** → Contract events trigger state refresh

---

## 4. User Journey

### Step 1: User Lands on Homepage
- User sees the Ancient Protocol landing page with hero section, property listings, and benefits
- Clear call-to-action: "Launch App" button

### Step 2: User Navigates to Faucet
- User clicks "Launch App" or "Faucet" in navigation
- App prompts wallet connection (auto-connects to local Anvil)
- User sees their current MockUSD balance

### Step 3: User Claims Test Tokens
- User clicks "Claim Test Tokens" button
- Wallet prompts for transaction confirmation
- Upon confirmation, user receives faucet amount of MockUSD
- Balance updates in real-time

### Step 4: User Browses Properties
- User navigates to "Create" page
- Property swiper displays available properties with images, prices, and details
- User can preview mortgage terms before committing

### Step 5: User Creates a Mortgage
- User selects a property
- User chooses down payment percentage (minimum 20%)
- User selects loan term (10-30 periods)
- User approves token spending
- User confirms mortgage creation transaction
- NFT is minted representing the mortgage position

### Step 6: User Makes Payments
- User navigates to "Mortgages" (Payments) page
- User sees their active mortgage positions in a card stack swiper
- User selects which position to pay
- User can make single or multiple payments at once
- Payment splits into principal and interest automatically
- Progress bar shows loan payoff percentage

### Step 7: User Tracks Progress
- Dashboard displays all user positions
- Each position shows remaining principal, payments completed, and payment history
- User can see amortization progress over time

---

## 5. MoSCoW Framework

### Must Have (Essential for MVP)
- **Wallet Connection**: Users can connect to the blockchain and switch accounts
- **Faucet**: Users can claim MockUSD test tokens for interactions
- **Property Display**: Browse available properties with metadata (price, location, details)
- **Mortgage Creation**: Create a mortgage with configurable down payment and term length
- **Smart Contract Integration**: All mortgage logic enforced on-chain (creation, payments, state tracking)
- **Payment Processing**: Make single payments on mortgage positions
- **NFT Position Tracking**: Each mortgage minted as NFT with ownership and payment history
- **Basic Dashboard**: View active mortgages and payment status

### Should Have (Important, Adds Value)
- **Multiple Payment Support**: Make multiple payments in a single transaction
- **Mortgage Preview**: Calculate payment schedules before committing
- **Token Approval Flow**: Proper ERC20 allowance handling for security
- **Progress Visualization**: Payment progress bars and completion percentages
- **Responsive Design**: Mobile-friendly UI with adaptive layouts
- **Transaction Feedback**: Clear success/error messages with transaction hashes

### Could Have (Nice-to-Have, Time Permitting)
- **Third-Party Payments**: Allow anyone to make payments on behalf of position owner (`makePaymentFor`)
- **Property Swiper Carousel**: Enhanced UI with Swiper.js card stack effect
- **Payment History**: Detailed view of all past payments per position
- **Overdue Detection**: Check if payments are late based on timestamp
- **Admin Dashboard**: View all mortgages across all users (admin-only)

### Won't Have (Excluded from MVP Scope)
- **Real Stablecoin Integration**: Using MockUSD instead of USDC/DAI
- **Production Blockchain**: Running on local Anvil, not mainnet/testnet
- **Secondary Market**: NFT trading or mortgage position transfers
- **Foreclosure Logic**: No liquidation or default handling
- **Credit Scoring**: No risk assessment or dynamic rate pricing
- **Legal Document Storage**: Contract URIs are placeholders, not actual legal docs
- **Interest Rate Oracle**: Rates are formula-based, not market-driven
- **Multi-Property Support**: Each mortgage tied to single property oracle entry

---

## 6. Walkthrough Video

**Video Link:** [TO BE ADDED - Record and insert YouTube/Loom link]

*Note: Video will demonstrate:*
1. Landing page navigation
2. Faucet token claim
3. Property browsing
4. Mortgage creation flow
5. Payment processing
6. Dashboard position tracking

**Maximum Duration:** 5 minutes

---

## 7. Live Prototype

**Live Demo URL:** [TO BE ADDED - Deploy to Fly.io or similar]

**Local Development:**
```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy contracts
cd contracts && forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Start frontend
bun run dev
```

**Access:** http://localhost:3000

---

## Additional Notes

### Key Features Demonstrated
- **DeFi + Real Estate**: Tokenized mortgage origination and servicing
- **NFT Positions**: Each mortgage is a unique, ownable digital asset
- **Amortization Logic**: On-chain calculation of principal/interest splits
- **Whitelist System**: Simulated KYC/AML compliance layer
- **Upgradeable Design**: Rate formula contract can be swapped by owner

### Technical Highlights
- **Bun Runtime**: Fast development cycle with hot reloading
- **Foundry Toolchain**: Efficient Solidity development and testing
- **Component Architecture**: Reusable React components with clear interfaces
- **Type Safety**: Full TypeScript coverage for frontend and contract ABIs

---

*Submission Date: 2026-03-06*
*Project: Ancient Protocol — Decentralized Mortgage Finance*
