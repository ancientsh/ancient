# Tasks

- [x] Fix scrolling issue - check for overflow:hidden blocking scroll on html/body
- [x] Fix theme inconsistency - components hardcoded to dark while page might be light
- [x] Match landing page to reference design - implement hero, property swiper, sections
- [ ] Ensure responsive design across all breakpoints

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
