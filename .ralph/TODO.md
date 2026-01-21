# Tasks

- [x] Fix scrolling issue - check for overflow:hidden blocking scroll on html/body
- [x] Fix theme inconsistency - components hardcoded to dark while page might be light
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

## Fix theme inconsistency - Done
- Removed hardcoded `dark` class from wrapper div in App.tsx (line 120)
- Changed html background-color from hardcoded dark color `hsl(222.2 84% 4.9%)` to `var(--color-background)` in styles/globals.css
- Files changed: src/App.tsx, styles/globals.css
- **Learnings:**
  - The app was forcing dark mode by wrapping everything in `className="dark"`
  - The reference demo uses light theme by default (no dark class on html/body)
  - CSS variables properly handle theming: `:root` defines light theme, `.dark` class overrides for dark
  - The html element had a hardcoded dark background that would show during page load, defeating the theme system
