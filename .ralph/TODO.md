# Tasks

- [x] Task 1: Fix scroll behavior - scroll should work anywhere on the page, not just on scrollbar
- [x] Task 2: Change mortgage selection UI from select to swiper component
- [x] Task 3: Use prettyDate for dates
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

## Task 2: Change mortgage selection UI from select to swiper component - Done
- Replaced all Select dropdowns in Mortgage.tsx with Swiper-based selectors
- Created 4 new swiper selector components:
  - `PropertySwiperSelector` - For selecting properties when creating a mortgage (mobile card stack + desktop horizontal slider)
  - `PropertySelectorCard` - Card component for property display in swiper
  - `PositionSwiperSelector` - For selecting mortgage positions when making payments (with progress details)
  - `PositionSelectorCard` - Card component for position display in swiper
  - `TermSwiperSelector` - Compact horizontal swiper for selecting loan term periods (10-30)
- Added Swiper imports and styles for effect-cards, navigation, and pagination
- Added CSS for `.mortgage-property-swiper`, `.mortgage-property-swiper-horizontal`, and `.term-swiper`
- Files changed: `src/pages/Mortgage.tsx`, `styles/globals.css`
- **Learnings:**
  - Swiper's `effect="cards"` creates a nice mobile-friendly card stack UI
  - For desktop, using `centeredSlides` with `slidesPerView > 1` creates a carousel-like experience
  - Auto-selecting first item on mount requires checking array bounds (`positions[0]` guard)
  - Using `onSwiper` callback to get the Swiper instance allows programmatic control via `slideTo()`
  - Custom navigation buttons work well with Swiper's `navigation.prevEl/nextEl` options

## Task 3: Use prettyDate for dates - Done
- Created new `PrettyDate` component in `src/components/ui/pretty-date.tsx`
- Component supports multiple formats: `date`, `time`, `datetime`, `countdown`, `relative`
- Features include customizable sizes (xs to 2xl), real-time countdown updates, and configurable labels
- Updated `src/pages/Dashboard.tsx`:
  - Imported PrettyDate component
  - Replaced `new Date(...).toLocaleDateString()` with `<PrettyDate date={...} format="date" size="xs" />`
- Updated `src/components/properties/PropertySwiper.tsx`:
  - Imported PrettyDate component
  - Replaced `registeredDate` variable and usage with inline `<PrettyDate date={...} format="date" size="xl" className="font-bold" />`
- Files changed: `src/components/ui/pretty-date.tsx` (new), `src/pages/Dashboard.tsx`, `src/components/properties/PropertySwiper.tsx`
- **Learnings:**
  - The gist reference provided a full-featured React component with countdown/relative time support
  - Timestamps from blockchain (Unix seconds) need to be multiplied by 1000 for JavaScript Date (milliseconds)
  - The `cn()` utility from lib/utils is used for merging Tailwind classes conditionally
