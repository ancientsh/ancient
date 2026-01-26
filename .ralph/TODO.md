# Tasks

- [x] Rename Mortgage page to Payments page (rename file, update imports, update navigation)
- [x] Update Payments page header text from "Mortgage Portal" to "Payments"
- [x] Remove Card container wrapper from the payments card in Payments page (MakePaymentsForm)
- [ ] Remove "Available Properties" section from Dashboard page
- [ ] Move the Create Mortgage section content to where Available Properties was (without Card container)

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
