# Tasks

- [x] Task 1: Fix scroll behavior - scroll should work anywhere on the page, not just on scrollbar
- [ ] Task 2: Change mortgage selection UI from select to swiper component
- [ ] Task 3: Use prettyDate for dates
- [ ] Task 4: Use prettyAmount for amounts

---

# Notes

_Append progress and learnings here after each iteration_

## Task 1: Fix scroll behavior - Done
- Added explicit `overflow-y: auto` to both `html` and `body` elements in `styles/globals.css`
- Files changed: `styles/globals.css`
- **Learnings:**
  - When setting `overflow-x: hidden` without explicitly setting `overflow-y`, some browsers interpret this as `overflow: hidden` entirely
  - This causes scrolling to only work via the scrollbar, not mouse wheel/trackpad on content areas
  - The fix is to explicitly set both `overflow-x: hidden` and `overflow-y: auto` to ensure proper scroll behavior
