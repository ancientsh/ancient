# Tasks

- [x] Fix scrolling issue - check for overflow:hidden blocking scroll on html/body
- [x] Fix theme inconsistency - components hardcoded to dark while page might be light
- [x] Match landing page to reference design - implement hero, property swiper, sections
- [x] Ensure responsive design across all breakpoints

---

# Notes

_Append progress and learnings here after each iteration_

## Fix scrolling issue - Done
- Added explicit height styles to html, body, and #root elements in src/index.css
- Added `flex flex-col min-h-screen` to the dark mode wrapper div in App.tsx
- Files changed: src/index.css, src/App.tsx
- **Learnings:**
  - SPA apps with Bun's HTML import need explicit height management on the #root container
  - The dark mode wrapper div was blocking proper flex layout flow
  - Using `min-h-screen` with `flex flex-col` ensures content can grow beyond viewport

## Fix theme inconsistency - Done
- Removed hardcoded `dark` class from wrapper div in App.tsx (line 120)
- Changed html background-color from hardcoded dark color `hsl(222.2 84% 4.9%)` to `var(--color-background)` in styles/globals.css
- Files changed: src/App.tsx, styles/globals.css
- **Learnings:**
  - The app was forcing dark mode by wrapping everything in `className="dark"`
  - The reference demo uses light theme by default (no dark class on html/body)
  - CSS variables properly handle theming: `:root` defines light theme, `.dark` class overrides for dark
  - The html element had a hardcoded dark background that would show during page load, defeating the theme system

## Match landing page to reference design - Done
- Created Section component at `src/components/ui/section.tsx` with support for fullHeight, variant (default/hero/fullscreen), and background options
- Created HeroSection component at `src/components/sections/hero-section.tsx` with parallax background image, headline, CTA button, and scroll indicator with ping animation
- Created PropertySwiperSection at `src/components/sections/property-swiper-section.tsx` with mobile card stack effect and desktop horizontal slider using Swiper.js
- Created AboutSection, ComparisonSection (renting vs owning math), JourneySection (4-step process), and BenefitsSection components
- Created Footer component at `src/components/sections/footer.tsx`
- Created mock property data at `src/lib/constants.ts` with LandingProperty interface and formatting utilities
- Created Landing page at `src/pages/Landing.tsx` that assembles all sections
- Updated App.tsx to show Landing page by default with "Launch App" button to access the MVP (Faucet/Dashboard/Mortgage)
- Files changed:
  - New: src/components/ui/section.tsx
  - New: src/components/sections/hero-section.tsx
  - New: src/components/sections/about-section.tsx
  - New: src/components/sections/comparison-section.tsx
  - New: src/components/sections/journey-section.tsx
  - New: src/components/sections/benefits-section.tsx
  - New: src/components/sections/property-swiper-section.tsx
  - New: src/components/sections/footer.tsx
  - New: src/components/sections/index.ts
  - New: src/lib/constants.ts
  - New: src/pages/Landing.tsx
  - Modified: src/App.tsx
- **Learnings:**
  - The reference uses Next.js with its Image component; for Bun, regular `<img>` tags work fine
  - The Swiper library works the same way in both environments with the same CSS imports
  - The landing page structure: Hero -> Property Swiper -> About -> Comparison -> Journey -> Benefits -> Footer
  - The app now has two modes: Landing (marketing) and MVP (protocol testing) with seamless navigation between them

## Ensure responsive design across all breakpoints - Done
- Added mobile-first responsive padding (`px-4 sm:px-6 lg:px-12`) to all section components
- Updated typography scales with smaller base sizes on mobile (`text-2xl sm:text-3xl md:text-4xl lg:text-5xl` pattern)
- Made navigation bar more compact on mobile with smaller heights, font sizes, and button padding
- Updated card grids to use 2 columns on mobile where appropriate (e.g., Journey section, Footer)
- Scaled down icons, badges, and interactive elements for mobile touch targets
- Made PropertySwiperSection details card responsive with smaller fonts and spacing on mobile
- Updated footer to properly stack on mobile with `grid-cols-2` base layout
- Files changed:
  - Modified: src/components/sections/about-section.tsx
  - Modified: src/components/sections/comparison-section.tsx
  - Modified: src/components/sections/journey-section.tsx
  - Modified: src/components/sections/benefits-section.tsx
  - Modified: src/components/sections/property-swiper-section.tsx
  - Modified: src/components/sections/footer.tsx
  - Modified: src/App.tsx (Navigation component)
- **Learnings:**
  - Tailwind's responsive prefixes (sm:, md:, lg:) should be applied mobile-first
  - Touch targets need to be at least 44x44px on mobile - use h-10/h-11 for buttons
  - The reference uses consistent responsive patterns: smaller sizes at base, scaling up with breakpoints
  - Navigation elements need careful balancing on mobile - account selector needs truncated addresses
  - Card grids work better as 2-col on mobile rather than single column for density
