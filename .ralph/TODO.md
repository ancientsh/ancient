# Tasks

- [x] Task 1: Fix scroll - scroll should work on page content, not just navbar/scrollbar
- [x] Task 2: Mortgage tab - cards should match PropertyCard structure, fix buggy config selections
- [ ] Task 3: Disable whitelist features - make those launch CTAs
- [ ] Task 4: Run typechecks

---

# Notes

_Append progress and learnings here after each iteration_

## Task 1: Fix scroll - Done
- Added `pointer-events-none` to the hero section background elements to prevent them from blocking scroll events on the page content
- Files changed: `src/components/sections/hero-section.tsx`
- **Learnings:**
  - The hero section had an `absolute inset-0` background div that was intercepting pointer/scroll events on the page content
  - Adding `pointer-events-none` to background/decorative elements is a common fix for scroll blocking issues
  - TypeScript check passed with no errors

## Task 2: Mortgage tab cards and config fixes - Done
- Redesigned `PropertySelectorCard` to match `PropertyCard` structure from dashboard:
  - Added same property images array (tulum, mexico_beachfront, a-frame, tony-stark)
  - Same aspect ratio (4/5), image background with hover scale effect
  - Glassmorphism badges (status "Available"/"Sold", value in USD)
  - Gradient overlay for text readability
  - Property info overlay with ID and location at bottom
  - Selection state now highlighted with ring and modified badge colors
- Fixed down payment input validation bugs:
  - Added proper onChange handler that clamps values between 20-80%
  - Added onBlur handler to reset invalid/empty values to minimum
  - Updated helper text from "Minimum 20%" to "20% - 80%"
- Fixed number of payments input validation:
  - Added onChange clamping between 1 and max remaining payments
  - Added onBlur fallback to reset invalid values to 1
- Files changed: `src/pages/Mortgage.tsx`
- **Learnings:**
  - HTML5 input min/max constraints don't prevent invalid state values - runtime validation needed
  - Reusing the same image array ensures visual consistency across the app
  - Selection state on image cards works well with ring + modified badge colors
