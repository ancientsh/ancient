12/22/25, 3:00 PM

Ancient Protocol Litepaper: On-Chain Mortgage Infrastructure

Ancient Protocol Litepaper
On-Chain Mortgage Infrastructure for the Borderless Economy
Ancient is building mortgage rails that connect crypto liquidity to real estate. The protocol combines on-chain
registration with off-chain bookkeeping to create verifiable, portable credit identities for a global mobile class
currently locked out of traditional mortgage systems.
This litepaper outlines the smart contract architecture, ordered by implementation sequence.

1. Core Infrastructure
The foundation layer establishes the contracts that power mortgage origination and property valuation.

Mortgage Factory Contract
The central hub for mortgage creation and treasury management. It holds:
Treasury Address: Where mortgage payments flow.
Mortgages Registry: Active mortgage positions linked to users.
The Factory enforces loan parameters: 10 to 30 year terms with a minimum 20% down payment.

Property Oracle Contract
A data layer that stores property metadata and valuations. The oracle feeds into the Factory, ensuring each
mortgage position references verified property data. Admins manage property listings; immutable state (e.g.,
location, original valuation) cannot be altered post-registration.

Rate Formula Contract
An upgradeable module that calculates interest rates and payment schedules. By isolating rate logic, the protocol
can adapt to market conditions without redeploying core contracts.

2. Access Control
Before users interact with mortgages, they must pass through the permissioning layer.

Whitelist Registry
A soulbound registry that gates access to the Mortgage Factory. Users cannot transfer their whitelist status.
Admins grant or revoke access based on KYC/AML compliance and eligibility criteria.
This design balances on-chain transparency with regulatory requirements for real-world asset transactions.

3. Mortgage Position NFT
file:///Users/anon/Desktop/mguleryuz/medium/ancient-litepaper.html

1/5

12/22/25, 3:00 PM

Ancient Protocol Litepaper: On-Chain Mortgage Infrastructure

The core asset representing a user's mortgage. Each NFT is soulbound (non-transferable by the holder) but can
be reassigned by admins in cases of legal transfer or foreclosure.

NFT Data Structure
Factory Address: Link to originating contract.
Property Oracle Pointer: Reference to the underlying property.
Legal Binding Contract: Hash or URI of the off-chain housing agreement.
Formula Parameters: Interest rate, term length, payment frequency.
Down Payment: Initial capital committed.
Historical Payments: On-chain record of all installments.
Previous NFTs Array: Pointers to prior positions (refinancing, transfers) with timestamps.
This NFT becomes the user's portable credit identity. Payment history stored on-chain serves as the foundation
for the On-Chain Credit Report (OCCR), a verifiable record that travels with the user across borders.

4. Payment Flow
Ancient uses a hybrid model: on-chain registration paired with off-chain bookkeeping.

On-Chain Registration
User initiates payment through the Mortgage Position NFT.
Payment transaction is recorded immutably on-chain.
Historical Payments array updates with amount, timestamp, and tx hash.

Off-Chain Bookkeeping
Detailed amortization schedules maintained off-chain for efficiency.
Legal documentation, receipts, and compliance records stored externally.
Periodic reconciliation ensures on-chain and off-chain records match.
This approach keeps gas costs low while preserving the cryptographic proof of payment that powers the OCCR.

5. OCCR: Privacy and Monetization Layer
The On-Chain Credit Report (OCCR) transforms raw payment history into a private, portable, and monetizable
credit identity. Zero-knowledge proofs enable users to prove creditworthiness without exposing sensitive data.

Design Goals
Privacy: Users prove attributes (e.g., "paid on time for 24 months") without revealing exact payment
amounts or dates.
Portability: Credit proofs travel with the user across chains and protocols.
Monetization: Users control access to their credit data and can sell verified proofs to lenders or partners.
Chain Agnostic: A single proof system that works across any blockchain where Ancient deploys.

ZK Infrastructure
file:///Users/anon/Desktop/mguleryuz/medium/ancient-litepaper.html

2/5

12/22/25, 3:00 PM

Ancient Protocol Litepaper: On-Chain Mortgage Infrastructure

The OCCR relies on a general-purpose zkVM (zero-knowledge virtual machine) for chain-agnostic proof
generation. Leading candidates include RISC Zero and Succinct SP1, both of which offer:
Multi-chain verification: Proofs generated off-chain can be verified on any EVM-compatible chain or
beyond.
Decentralized prover networks: Proof generation is distributed across permissionless provers,
eliminating single points of failure.
General-purpose computation: Any logic (credit scoring algorithms, payment verification) can be proven
without custom circuits.

Proof Flow
1. Data aggregation: The zkVM reads the user's Mortgage Position NFT and Historical Payments from onchain state.
2. Credit computation: Off-chain, the zkVM executes a credit scoring algorithm over the payment data.
3. Proof generation: A ZK proof attests to the computed credit score without revealing underlying
transactions.
4. On-chain verification: Any chain with a verifier contract can validate the proof and consume the credit
score.
This architecture ensures that credit proofs are portable across chains and verifiable by any smart contract,
without exposing raw payment data.

Monetization Model
Users own their OCCR and control access:
Pay-per-proof: Lenders or partners pay a fee (in stablecoins or protocol tokens) to receive a ZK proof of
creditworthiness.
Subscription access: Users grant time-limited access to credit data for recurring payments.
Data marketplace: Aggregated, anonymized credit signals can be sold to researchers or underwriters,
with users receiving a share of proceeds.
Smart contracts enforce access control: proofs are only generated when payment is received, and users can
revoke access at any time.

6. Admin Operations
Admins maintain protocol integrity and handle edge cases that require human intervention.

Permissions
Whitelist/Unwhitelist Users: Gate access to mortgage origination.
Transfer NFT Ownership: Handle legal transfers, inheritance, or foreclosure.
Update Property State: Modify mutable property data (excluding immutable fields).
Add/Remove Properties: Manage the Property Oracle registry.
Admin actions are logged on-chain for auditability. Multi-sig or timelocks can be layered for additional security.

7. Third-Party Integrations
file:///Users/anon/Desktop/mguleryuz/medium/ancient-litepaper.html

3/5

12/22/25, 3:00 PM

Ancient Protocol Litepaper: On-Chain Mortgage Infrastructure

The protocol is designed for extensibility. External services plug into Ancient via SDK integrations.

BTC-Collateralized Loan Module
For users who hold Bitcoin and want to avoid taxable sell events, a third-party BTC loan SDK can be integrated.
Users collateralize BTC to generate stablecoin liquidity for down payments or installments. This module
operates externally; Ancient consumes the resulting stablecoin payment without managing custody or liquidation
logic.
Additional integrations (fiat on-ramps, identity providers, credit scoring oracles) follow the same pattern:
external services feed data or liquidity into the core contracts.

Architecture Summary
The following diagram illustrates the contract relationships:
Property Oracle ──────► Mortgage Factory ◄────── Whitelist Registry
│
▼
Rate Formula Contract
│
▼
Mortgage Position NFT
(Soulbound to User)
│
┌─────────┴─────────┐
▼
▼
On-Chain Payments
Off-Chain Books
│
│
└─────────┬─────────┘
▼
┌──────────────────────┐
│
zkVM (Off-Chain) │
│ ┌────────────────┐ │
│ │ Read Payments │ │
│ │ Compute Score │ │
│ │ Generate Proof │ │
│ └────────────────┘ │
└──────────────────────┘
│
▼
┌──────────────────────┐
│ OCCR (Any Chain)
│
│ - Credit Score
│
│ - Verifiable Proof │
│ - Monetization
│
└──────────────────────┘

Implementation Roadmap
The architecture ships in phases, each building on the previous:
1. Phase 1: Deploy Property Oracle and Rate Formula contracts.
2. Phase 2: Launch Mortgage Factory with Whitelist integration.
file:///Users/anon/Desktop/mguleryuz/medium/ancient-litepaper.html

4/5

12/22/25, 3:00 PM

Ancient Protocol Litepaper: On-Chain Mortgage Infrastructure

3. Phase 3: Mint Mortgage Position NFTs; enable payment flow.
4. Phase 4: Integrate off-chain bookkeeping and reconciliation.
5. Phase 5: Deploy OCCR ZK layer (zkVM integration, verifier contracts).
6. Phase 6: Launch credit score monetization and data marketplace.
7. Phase 7: Open SDK for third-party modules (BTC loans, fiat ramps).

Conclusion
Ancient's smart contract architecture creates a trust-minimized mortgage layer. On-chain registration ensures
payment history is immutable and portable. Off-chain bookkeeping keeps operations efficient and compliant.
Zero-knowledge proofs transform this data into a private, user-owned credit identity that can be selectively
disclosed and monetized. The result: a borderless credit system that unlocks real estate for millions currently
invisible to legacy finance, while giving users full control over their financial reputation.

file:///Users/anon/Desktop/mguleryuz/medium/ancient-litepaper.html

5/5

