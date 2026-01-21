# Tasks

- [x] Fix scrolling issue - check for overflow:hidden blocking scroll on html/body
- [ ] Fix theme inconsistency - components hardcoded to dark while page might be light
- [ ] Match landing page to reference design - implement hero, property swiper, sections
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
