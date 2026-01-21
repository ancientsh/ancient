# Ancient Protocol MVP

## Stack
- Smart contracts: Foundry (Forge)
- Local chain: Anvil
- Frontend: Simple preview UI

## Scope
Build core mortgage infrastructure only:
- Property Oracle
- Rate Formula
- Whitelist Registry
- Mortgage Factory
- Mortgage Position NFT
- Payment flow (on-chain registration)

**Skip for MVP:** OCCR, ZK proofs, off-chain bookkeeping, third-party integrations

## Timeframes
Use 1-minute intervals for all time-based logic (payment periods, terms) to enable quick PoC testing.

## Frontend Pages
- Main dashboard (view properties, mortgages)
- Faucet page (get test tokens)
- Mortgage interaction (create position, make payments)
