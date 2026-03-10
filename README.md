# Ancient Protocol

> **On-chain mortgage infrastructure for real-world real estate**

A full-stack DeFi protocol that tokenizes mortgage positions, enabling compliant real estate financing through NFT-backed loans.

---

## Stack

| Layer | Tech |
|-------|------|
| **Smart Contracts** | Solidity 0.8.24 + Foundry |
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + Radix UI |
| **Web3** | viem |
| **Runtime** | Bun |
| **Deployment** | Fly.io |
| **Local Chain** | Anvil |

---

## Features

### Smart Contracts

| Contract | Description |
|----------|-------------|
| `MortgageFactory` | Central hub for mortgage origination, payment processing (`makePayment`, `makePaymentFor`), admin management, treasury control |
| `MortgagePositionNFT` | ERC-721 NFT representing mortgage positions with embedded payment history, principal/interest tracking, admin transfers |
| `PropertyOracle` | On-chain property registry with valuation tracking, metadata URIs, active/inactive status |
| `RateFormula` | Amortization engine calculating principal, interest, payment schedules, overdue detection |
| `WhitelistRegistry` | KYC/AML access control with whitelisting, revocation, reinstatement, KYC reference storage |
| `MockUSD` | Test ERC-20 token with faucet (10,000 mUSD per claim) |

### Frontend

| Feature | Description |
|---------|-------------|
| **Property Swiper** | Mobile: card-stack effect; Desktop: horizontal slider with navigation. Shows property images, location, valuation, appreciation |
| **KYC Modal** | 3-step identity verification (form → verifying → verified) with sessionStorage persistence, prefilled demo data, Sumsub placeholder |
| **Mortgage Creation** | Property selection via Swiper, down payment slider (20-80%), term selector (10-30 yrs), real-time preview, token approval flow |
| **Dashboard** | View user's NFT positions, payment history, remaining principal, payments completed |
| **Faucet** | Claim test mUSD tokens, view balance, toast notifications on success/failure |
| **Toast Notifications** | Sonner-based alerts for all transactions (approval, mortgage creation, payments) |

### DevX

- One-command local env (`bun run dev` spins up Anvil + deploys contracts + starts frontend)
- Auto-deploys all contracts on startup with whitelisted + funded accounts
- Hot module reloading (HMR) for frontend
- RPC proxy (`/rpc`) forwarding to Anvil with CORS headers
- Health check endpoint (`/rpc/health`)

---

## Quick Start

```bash
bun install        # Install dependencies
bun run dev        # Start Anvil + deploy contracts + frontend
bun run build      # Production build
bun run fly:deploy # Deploy to Fly.io
```

---

## Live

**Frontend:** https://ancient.sh

---

## Architecture

```
┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  Bun Server     │
│   (React/TS) │     │  (RPC Proxy)    │
└──────────────┘     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Anvil Chain   │
                     └────────┬────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌──────────┐          ┌──────────┐            ┌──────────┐
│ Mortgage │          │ Property │            │ Whitelist│
│ Factory  │          │  Oracle  │            │ Registry │
└──────────┘          └──────────┘            └──────────┘
```

---

## License

MIT
