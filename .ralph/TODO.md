# Tasks

- [x] Update globals.css with dark theme, gold/amber primary color, and swiper styles from reference
- [x] Update App.tsx with dark mode wrapper and polished navbar with backdrop-blur
- [x] Add property images to public folder and create PropertyCard with image background and glassmorphism badges
- [x] Install swiper and create PropertySwiper component for Dashboard
- [x] Update Dashboard.tsx to use PropertySwiper and styled mortgage position cards
- [ ] Restyle Faucet.tsx with centered dark card styling
- [ ] Restyle Mortgage.tsx with polished form cards and input styling

---

# Notes

_Append progress and learnings here after each iteration_

## Update globals.css with dark theme - Done
- Copied dark theme CSS variables from reference `ancient-demo/app/globals.css`
- Added gold/amber primary color: `oklch(0.7686 0.1647 70.0804)`
- Added Swiper custom styles for navigation arrows and pagination dots
- Updated both light and dark theme variables
- Files changed: `styles/globals.css`
- **Learnings:**
  - Reference uses oklch color space for all colors
  - Swiper styles target `.swiper-button-next/prev` and `.swiper-pagination-bullet`
  - Dark theme uses darker backgrounds with gold primary color kept consistent

## Update App.tsx with dark mode wrapper and navbar - Done
- Added `.dark` class wrapper around AppContent to enable dark mode
- Updated Navigation component with polished styling:
  - Fixed position navbar with `fixed top-0 z-50 w-full`
  - Semi-transparent background with blur: `bg-card/95 backdrop-blur-sm`
  - Consistent height with `h-16`
  - Responsive padding with `px-4 lg:px-12`
- Improved logo styling with hover effect and transition
- Added primary color styled MVP badge with `bg-primary/20 text-primary rounded-full`
- Enhanced account selector with muted background and hover states
- Added `pt-16` to main content to account for fixed navbar height
- Improved footer with subtle card background
- Files changed: `src/App.tsx`
- **Learnings:**
  - Fixed navbar requires padding-top on main content equal to navbar height
  - Using `bg-card/95` with `backdrop-blur-sm` creates a nice frosted glass effect
  - Tailwind opacity modifiers (e.g., `/95`, `/50`) work with CSS variables

## Add property images and PropertyCard component - Done
- Created `public/` folder with 4 property images copied from reference demo:
  - `tulum.jpeg`, `mexico_beachfront.jpg`, `a-frame.jpeg`, `tony-stark.jpeg`
- Updated `src/index.ts` to serve static assets from `/public/*` route
- Created `src/components/properties/PropertyCard.tsx` with:
  - Full-bleed background image with aspect ratio `aspect-[4/5]`
  - Hover scale effect on image: `group-hover:scale-105`
  - Gradient overlay for text readability: `bg-gradient-to-t from-black/70`
  - Glassmorphism status badge (top-right): `bg-white/90 backdrop-blur-sm border-primary/60`
  - Glassmorphism value badge (top-left): `bg-black/40 backdrop-blur-sm border-white/30`
  - Info overlay at bottom with glassmorphism card: `bg-black/50 backdrop-blur-md`
- Created `src/components/properties/index.ts` for exports
- Files changed: `src/index.ts`, `src/components/properties/PropertyCard.tsx`, `src/components/properties/index.ts`, `public/` folder
- **Learnings:**
  - Bun.serve() needs explicit static file handling - added route `/public/*` with `Bun.file()`
  - Glassmorphism effect combines: semi-transparent bg + backdrop-blur + subtle border
  - Property images cycle based on ID using modulo: `propertyImages[id % propertyImages.length]`
  - Card shadows transition: `shadow-xl` -> `hover:shadow-2xl` for depth effect

## Install swiper and create PropertySwiper component - Done
- Installed `swiper@12.0.3` package via `bun add swiper`
- Created `src/components/properties/PropertySwiper.tsx` with:
  - Mobile: Card stack effect using `EffectCards` module
  - Desktop: Horizontal slider with `Navigation` and `Pagination` modules
  - Responsive layout: `flex-col` on mobile, `flex-row` on desktop
  - Active property details card showing stats alongside swiper
- PropertyDetailsCard component shows:
  - Current/original valuation with formatting
  - Value change percentage with trend icon
  - Registration date
  - Status indicator
  - "Apply for Mortgage" CTA button
- Imported Swiper CSS modules: `swiper/css`, `effect-cards`, `navigation`, `pagination`
- Updated `src/components/properties/index.ts` to export PropertySwiper
- Files changed: `package.json`, `src/components/properties/PropertySwiper.tsx`, `src/components/properties/index.ts`
- **Learnings:**
  - Swiper modules (EffectCards, Navigation, Pagination) must be imported and passed to `modules` prop
  - `slidesPerView={1.2}` with `centeredSlides` creates a peek-ahead effect on desktop
  - Mobile card stack uses `perSlideOffset` and `perSlideRotate` for 3D effect
  - Need to handle potential undefined with `noUncheckedIndexedAccess` - use `?? fallback`

## Update Dashboard.tsx to use PropertySwiper and styled mortgage position cards - Done
- Replaced basic property grid with PropertySwiper component for property browsing
- Created new `MortgagePositionCard` component with polished styling:
  - Status badge with glassmorphism effect (Paid Off/Active/Closed states)
  - Gradient progress bar with percentage and periods remaining
  - Stats grid with uppercase labels and formatted values
  - Details section with icons (TrendingUp, DollarSign, Clock, Calendar)
  - Hover shadow transition: `hover:shadow-2xl`
- Updated section headers with subtitle descriptions
- Enhanced loading states with animated spinner icon (RefreshCw with animate-spin)
- Styled empty states with dashed border card and centered icon/text
- Added lucide-react icons: TrendingUp, Calendar, DollarSign, Clock, RefreshCw
- Files changed: `src/pages/Dashboard.tsx`
- **Learnings:**
  - Removed unused import (MortgageFactoryAbi) - keep imports clean
  - CardDescription needed to stay imported for error state fallback
  - Using `bg-gradient-to-r from-primary to-primary/80` creates depth in progress bars
  - Uppercase tracking-wider labels (`text-xs uppercase tracking-wider`) give a premium feel
