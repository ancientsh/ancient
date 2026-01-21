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
Transform the basic UI into a polished MVP that looks like the reference demo.

### Visual Requirements

**1. Property Images**
- Add placeholder property images to `public/` (use Unsplash real estate photos or similar)
- Each property card should display a full-bleed image with overlay text
- Use aspect-ratio cards like `aspect-[4/5]` for consistent sizing

**2. Swiper Carousel**
- Install `swiper` package
- Implement property swiper like `refs/ancient-demo/src/components/properties/property-swiper.tsx`
- Add navigation arrows and pagination dots styled with primary color
- Smooth slide transitions, responsive breakpoints

**3. Dark Theme**
- Copy the dark theme CSS variables from `refs/ancient-demo/app/globals.css`
- Apply `.dark` class to root or use dark mode by default
- Use the gold/amber primary color (`oklch(0.7686 0.1647 70.0804)`)

**4. Card Styling**
- Property cards: Image background, glassmorphism badges, hover scale effects
- Mortgage position cards: Dark cards with progress bars, status badges
- Use `shadow-xl`, `hover:shadow-2xl` transitions

**5. Navbar**
- Fixed position with `backdrop-blur-sm`
- Semi-transparent background `bg-card/95`
- Clean logo + navigation links + account selector

**6. Polish**
- Smooth hover transitions on all interactive elements
- Proper spacing with container and consistent padding
- Loading states and empty states styled nicely

### Pages to Restyle
- `src/App.tsx` - Dark theme wrapper, polished navbar
- `src/pages/Dashboard.tsx` - Property swiper, styled mortgage position cards
- `src/pages/Faucet.tsx` - Centered card with nice styling
- `src/pages/Mortgage.tsx` - Form cards with proper input styling

### Keep Working
- All contract interactions (viem calls)
- Web3Provider and account switching
- Existing page functionality

## Timeframes
Use 1-minute intervals for all time-based logic (payment periods, terms) to enable quick PoC testing.
