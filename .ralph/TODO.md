# Tasks

- [x] Update globals.css with dark theme, gold/amber primary color, and swiper styles from reference
- [x] Update App.tsx with dark mode wrapper and polished navbar with backdrop-blur
- [ ] Add property images to public folder and create PropertyCard with image background and glassmorphism badges
- [ ] Install swiper and create PropertySwiper component for Dashboard
- [ ] Update Dashboard.tsx to use PropertySwiper and styled mortgage position cards
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
