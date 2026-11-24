# fuerte-frontend

## Code review
Follows Raf's global "Code review" rule (`~/.claude/CLAUDE.md`) and the root CLAUDE.md "Code review — what complete means here" section.

## Conventions (moved from the root CLAUDE.md)

- **App frame**: `src/app/layout.tsx` is a Server Component (fonts + the tab-title template); the live frame (Pusher maintenance channel, loader, CallCenterGuard, toasts) is `src/components/AppShell`
- **Tab titles**: every new page sets its own title — `export const metadata = { title: 'X' }` in a server `page.tsx`, or a segment `layout.tsx` for a client page; record pages call `hooks/useDocumentTitle` once the record loads (never server `generateMetadata` fetching: the token is in the browser). The tab then reads "X · Fuerte Lending" (`utils/appTitle.ts`).

### Every screen has its own URL (Raf, 2026-10-28)
- **Needs its own URL:** a full-screen form, a detail page, or a create/edit screen. Opening it changes the address bar, and Back and refresh return to the same screen. Use a route (`.../new`, `.../[id]`, `.../[id]/edit`), never a `showForm` / `isEditing` state that hides the list and shows a form at the same address.
- **Does not:** tabs inside a page (a borrower's Loan tab), small dialogs and confirmations, dropdowns and filters.
- **Why:** Back, refresh, bookmarks and sending a link to a co-worker all work. Loan Proceed Settings broke this (the form opened at the list's address, and Back left the page); it now has `/accounting/loan-proceed-settings/new` and `/accounting/loan-proceed-settings/<branch id or global>`.
- **Edit screens load their record from the URL**, not from the clicked row, so a refresh or a pasted link works.
- **Checked by the regress suite:** the static stage's `screen-urls` check (`regress/lib/screen-urls.mjs`) fails on a component that hides its list behind form state (`{!showForm && (` or `{showForm ? (`). A real exception goes in `regress/config/screen-url-exceptions.json` with a reason. `regress/specs/smoke/screen-urls.spec.mjs` proves Back and refresh on the fixed screens in the browser.
- **Fixed 2026-10-28:** Loan Proceed Settings, General Voucher (`/new?type=cv|jv`), Adjusting Entries (`/new`, `/<entry id>`), Vendors (`?type=` on the list, `/new?type=`, `/<vendor id>`). Not yet: the Branch Setup sub-branch drill-down, and the side-by-side forms (Area, Sub Area, Banks, Chiefs, Companies, Users, Loan Types, Chart of Accounts) that open under the list on phones.
