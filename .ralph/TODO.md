# Tasks

- [x] Task 1
- [x] Task 2

---

# Notes

_Append progress and learnings here after each iteration_

## Task 1 - Done
- Fixed TypeScript errors in build.ts (type safety for parseArgs function)
- Removed non-functional `h-max-content` CSS class from sections (about, comparison, journey, benefits)
- Verified app builds and serves correctly
- Files changed:
  - `build.ts` - Fixed type errors with parseArgs return type and index access
  - `src/components/sections/about-section.tsx` - Removed h-max-content
  - `src/components/sections/comparison-section.tsx` - Removed h-max-content
  - `src/components/sections/journey-section.tsx` - Removed h-max-content
  - `src/components/sections/benefits-section.tsx` - Removed h-max-content
- **Learnings:**
  - Tailwind 4 JIT doesn't auto-generate `h-max-content`, need to use `h-[max-content]` for arbitrary values
  - The Section component already handles height via `min-h-fit` when fullHeight is false
  - Build system uses Bun.build with tailwind plugin for CSS processing

## Task 2 - Done
- Fixed scrolling issue caused by nested flex containers
- Removed redundant outer flex wrapper in App component
- Simplified #root CSS to remove unnecessary flex properties
- Files changed:
  - `src/App.tsx` - Removed `<div className="flex flex-col min-h-screen">` wrapper around `<AppContent />`
  - `src/index.css` - Simplified `#root` styles to just `min-height: 100vh` (removed `display: flex` and `flex-direction: column`)
- **Learnings:**
  - Nested flex containers with `min-h-screen` can cause scrolling issues when content exceeds viewport height
  - The fix simplifies the DOM hierarchy: #root (min-h-100vh) → AppContent wrapper (flex col, min-h-screen) → Landing content
  - Natural document flow handles scrolling better than constrained flex containers
