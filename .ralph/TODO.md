# Tasks

- [x] Update globals.css with dark theme, gold/amber primary color, and swiper styles from reference
- [ ] Update App.tsx with dark mode wrapper and polished navbar with backdrop-blur
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
