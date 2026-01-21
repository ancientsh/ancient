# Ancient Protocol MVP

## Stack
- Smart contracts: Foundry (Forge) - **DONE, DO NOT MODIFY**
- Local chain: Anvil
- Frontend: Bun + React (NOT Next.js) with Tailwind CSS 4
- Web3: viem for contract interactions

## Scope
Contracts are complete. Now upgrade the frontend UI to match the beautiful design in `.ralph/refs/ancient-demo/`.

## Contract Logic
**DO NOT CHANGE** - All contracts in `contracts/` are complete and working:
- PropertyOracle, RateFormula, WhitelistRegistry, MortgageFactory, MortgagePositionNFT, MockUSD
- Contract ABIs and addresses in `src/contracts/`
- Web3Provider context already set up

## Frontend Upgrade Task
Restyle the existing pages (`src/pages/`, `src/App.tsx`) using UI patterns from the reference:

### Reference Location
`.ralph/refs/ancient-demo/` contains the prettier UI to emulate:
- Dark theme with oklch colors (see `app/globals.css`)
- shadcn/ui components (see `src/components/ui/`)
- Modern card designs, glassmorphism effects
- Responsive layouts, smooth transitions

### Key Patterns to Apply
1. **Styling**: Copy the CSS variables and theme from `refs/ancient-demo/app/globals.css` into `styles/globals.css`
2. **Components**: Use the card, button, section patterns from `refs/ancient-demo/src/components/ui/`
3. **Layout**: Navbar with backdrop blur, proper spacing, dark mode by default
4. **Cards**: Property and position cards should look like `refs/ancient-demo/src/components/properties/property-card.tsx`

### Pages to Restyle
- `src/App.tsx` - Navigation bar styling
- `src/pages/Faucet.tsx` - Token claim UI
- `src/pages/Dashboard.tsx` - Properties and mortgage positions display
- `src/pages/Mortgage.tsx` - Create mortgage and payment forms

### Keep Working
- All contract interactions (viem calls)
- Web3Provider and account switching
- Existing page functionality

## Timeframes
Use 1-minute intervals for all time-based logic (payment periods, terms) to enable quick PoC testing.
