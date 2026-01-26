# Tasks

- [x] Rename Mortgage page to Payments page (rename file, update imports, update navigation)
- [ ] Update Payments page header text from "Mortgage Portal" to "Payments"
- [ ] Remove Card container wrapper from the payments card in Payments page (MakePaymentsForm)
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
