# Tasks

- [x] Rename Mortgage page to Payments page (rename file, update imports, update navigation)
- [x] Update Payments page header text from "Mortgage Portal" to "Payments"
- [x] Remove Card container wrapper from the payments card in Payments page (MakePaymentsForm)
- [x] Remove "Available Properties" section from Dashboard page
- [x] Move the Create Mortgage section content to where Available Properties was (without Card container)

---

# Notes

_Append progress and learnings here after each iteration_

## Rename Mortgage page to Payments page - Done
- Renamed `src/pages/Mortgage.tsx` to `src/pages/Payments.tsx`
- Updated export function name from `Mortgage` to `Payments`
- Updated default export from `Mortgage` to `Payments`
- Updated comment at top of file
- In `src/App.tsx`:
  - Changed import from `Mortgage` to `Payments`
  - Changed Page type from `"mortgage"` to `"payments"`
  - Changed navigation item name and link from "Mortgage"/"mortgage" to "Payments"/"payments"
  - Changed route rendering from `<Mortgage />` to `<Payments />`
- **Learnings:**
  - Navigation is defined inline in the `Navigation` component as an array of `{ name, link }` objects
  - The Page type controls routing via conditional rendering in `AppContent`

## Update Payments page header text from "Mortgage Portal" to "Payments" - Done
- Changed header text in three locations in `src/pages/Payments.tsx`:
  - Line 97: Loading state CardTitle
  - Line 115: Error state CardTitle
  - Line 144: Main page h1 header
- All instances of "Mortgage Portal" replaced with "Payments"
- **Learnings:**
  - The Payments page has three different render states: loading, error, and connected
  - Each state has its own header that needs to be updated for consistency

## Remove Card container wrapper from MakePaymentsForm - Done
- Removed `Card`, `CardHeader`, `CardContent`, and `CardFooter` wrappers from `MakePaymentsForm` component
- Replaced with a simple `<div className="space-y-6">` container
- Converted `CardTitle` and `CardDescription` to `<h2>` and `<p>` elements
- Moved action buttons from `CardFooter` to a regular div with same flex styling
- Files changed: `src/pages/Payments.tsx`
- **Learnings:**
  - The Card components are still imported and used elsewhere in the file (loading/error states and `CreateMortgageForm`), so no import changes needed
  - The component structure was: Card > CardHeader/CardContent/CardFooter > content
  - Converting to a flat div structure maintains the same visual spacing via `space-y-6` class

## Remove "Available Properties" section from Dashboard page - Done
- Removed the entire "Available Properties" section (lines 282-327) from `src/pages/Dashboard.tsx`
- Removed unused state variables: `properties`, `propertyMetadata`, `isLoadingProperties`
- Removed `fetchProperties` callback function
- Removed `fetchProperties` call from useEffect
- Removed unused imports:
  - `PropertySwiper`, `type PropertyMetadata` from `@/components/properties`
  - `PropertyOracleAbi` from `../contracts`
- Removed unused `Property` interface
- Files changed: `src/pages/Dashboard.tsx`
- **Learnings:**
  - The Dashboard page now only shows "Your Mortgages" section
  - The "no mortgage positions" message still references "Browse properties below" - this may need updating in a future task since the properties section is now gone

## Move Create Mortgage section to Dashboard - Done
- Created shared `CreateMortgageForm` component at `src/components/mortgage/CreateMortgageForm.tsx`
- Created barrel export at `src/components/mortgage/index.ts`
- The component accepts a `showCard` prop (default `true`) to control Card wrapper rendering
- Updated `src/pages/Dashboard.tsx`:
  - Added import for `CreateMortgageForm` from `@/components/mortgage`
  - Added Create Mortgage section after "Your Mortgages" section using `<CreateMortgageForm showCard={false} />`
  - Updated "no mortgage positions" message from "Browse properties below" to "Create a mortgage below"
- Updated `src/pages/Payments.tsx`:
  - Replaced inline `CreateMortgageForm`, `PropertySwiperSelector`, `TermSelector` components with import from `@/components/mortgage`
  - Removed unused interfaces: `Property`, `MortgagePreview`
  - Removed unused imports: `formatBps`, `parseBps`, `CardFooter`, `DollarSign`, `Clock`, `Percent`, `AlertTriangle`, `Banknote`, `Wallet`, `Calculator`
- Files changed:
  - `src/components/mortgage/CreateMortgageForm.tsx` (new)
  - `src/components/mortgage/index.ts` (new)
  - `src/pages/Dashboard.tsx` (modified)
  - `src/pages/Payments.tsx` (modified)
- **Learnings:**
  - The CreateMortgageForm is a large component (~800 lines) with complex dependencies (Swiper, contract interactions, multiple sub-components)
  - Using a `showCard` prop allows the same component to be used with or without Card wrapper
  - The Payments page now uses the shared component with Card wrapper (default), Dashboard uses it without
