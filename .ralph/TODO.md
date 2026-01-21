# Tasks

- [x] Task 1: Fix scroll - scroll should work on page content, not just navbar/scrollbar
- [ ] Task 2: Mortgage tab - cards should match PropertyCard structure, fix buggy config selections
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
