# Tasks

- [x] Install liquidcn package
- [x] Replace UI components with liquidcn components

---

# Notes

_Append progress and learnings here after each iteration_

## Install liquidcn package - Done
- Installed liquidcn@0.0.2 using `bun add liquidcn`
- Verified build still passes after installation
- Files changed: package.json, bun.lock
- **Learnings:**
  - liquidcn exports from `liquidcn`: Button, Card, Input, Textarea, PrettyAmount, Alert, Badge, Footer
  - liquidcn exports from `liquidcn/client`: Select, PrettyDate, Dialog, ResizableNavbar, Slider, Sonner, Switch, Tabs
  - The project currently has these matching local UI components that can be replaced: Button, Card, Input, Label, Select, Textarea
  - Note: Label is not in liquidcn, so it needs to stay local

## Replace UI components with liquidcn components - Done
- Replaced 7 UI component files to re-export from liquidcn instead of local implementations
- Files changed:
  - `src/components/ui/button.tsx` - re-exports Button, buttonVariants, ButtonProps from `liquidcn`
  - `src/components/ui/card.tsx` - re-exports Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle from `liquidcn`
  - `src/components/ui/input.tsx` - re-exports Input from `liquidcn`
  - `src/components/ui/textarea.tsx` - re-exports Textarea from `liquidcn`
  - `src/components/ui/select.tsx` - re-exports Select components from `liquidcn/client`
  - `src/components/ui/pretty-amount.tsx` - re-exports PrettyAmount, PrettyAmountSize from `liquidcn`
  - `src/components/ui/pretty-date.tsx` - re-exports PrettyDate from `liquidcn/client`
- Components kept local (not in liquidcn):
  - `src/components/ui/label.tsx` - Label component
  - `src/components/ui/section.tsx` - Section layout component
- Build and TypeScript checks pass
- **Learnings:**
  - Re-exporting from the local UI files maintains all existing imports across the codebase
  - Server components from `liquidcn` and client components from `liquidcn/client` need separate imports
  - The `"use client"` directive is needed in select.tsx and pretty-date.tsx for client components