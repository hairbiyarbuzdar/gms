# UI Registry

## Invoice history

File: src/app/app/invoices/invoice-history.tsx
Last updated: 2026-09-29

| Property | Classes |
| --- | --- |
| Table surface | bg-card, border border-border, rounded |
| Header row | bg-primary-tint, label-caps, text-muted-foreground |
| Cells | px-4 py-3; text-sm for names, data-mono for numbers and dates |
| Section title | text-lg font-semibold |
| Search field | rounded border border-input bg-background, text-sm, py-2.5 |
| Input focus | focus:border-primary focus:ring-1 focus:ring-primary |
| Empty state | bg-card, border border-border, rounded, px-4 py-10 |
| Secondary copy | text-[13px] text-muted-foreground |
| Shadows | None |

Pattern notes: Matches the existing expenses table and form tokens. Totals are right-aligned with two decimal places. Label search inputs explicitly. Distinguish empty history from no search results; keep wide tables horizontally scrollable on small screens. This entry records the invoice component, not a project-wide audit.

## Checkout invoice modal

Files: src/app/app/invoices/invoice-dialog.tsx, src/app/app/invoices/invoice-receipt.ts
Last updated: 2026-09-29

| Property | Classes / pattern |
| --- | --- |
| Modal | Existing Dialog primitives, rounded border border-border |
| Preview | rounded border border-border, white print document |
| Primary button | bg-primary text-primary-foreground, rounded, px-4 py-2.5, hover:bg-primary-hover |
| Secondary button | rounded border border-border, hover:bg-secondary |
| Keyboard focus | focus-visible:outline-2 focus-visible:outline-primary |
| Receipt | 80 mm thermal paper, 4 mm padding, black text, dashed row separators, right-aligned money with two decimals |

Pattern notes: Preview and print share the same escaped HTML document. Keep print controls outside the receipt. Receipt headers repeat across printed pages; rows and totals avoid page breaks. The modal opens only after a saved sale. Thermal receipts use two columns, with quantity and unit price below the item name; the printer driver controls roll length. Select 80 mm paper and disable browser headers and footers.

## Membership photo field

File: src/components/photo-capture.tsx
Last updated: 2026-09-29

| Property | Classes / pattern |
| --- | --- |
| Preview | rounded border border-border bg-secondary, square crop |
| Labels | label-caps text-muted-foreground |
| Secondary buttons | rounded border border-border px-3 py-2 text-[13px], hover:border-primary hover:text-primary |
| Capture action | bg-primary text-primary-foreground, rounded, hover:bg-primary-hover |
| Focus | focus-visible:outline-2 focus-visible:outline-primary |
| Errors | text-[13px] text-destructive, role=alert |

Pattern notes: Upload and webcam share one preview and the existing member photo field. Keep the previous photo until a replacement succeeds. Stop camera tracks on capture, cancel, upload, or unmount. Disable saving while preparing the photo; show an upload fallback when camera access fails.

## Membership and renewal receipts

Files: src/lib/membership-receipt.ts, src/app/app/memberships/add-member-dialog.tsx, src/app/app/memberships/renew-dialog.tsx
Last updated: 2026-09-29

Pattern notes: Reuse the checkout receipt modal and 80 mm thermal document. Print the saved payment amount with its unique payment reference, member ID, package, payment method, period start, and next renewal date. Payment receipts omit retail subtotal/discount rows. After joining, show the receipt first and then the existing barcode dialog. Keep the renewal dialog mounted when its last table row leaves the current filter.

## Invoice history actions

Files: src/app/app/invoices/invoice-history.tsx, src/app/app/invoices/invoice-edit-dialog.tsx
Last updated: 2026-09-30

| Property | Classes / pattern |
| --- | --- |
| Row actions | Text labels with Lucide icons; rounded border border-border; text-primary; destructive color for Delete |
| Editor | Existing Dialog primitives, rounded border border-border, scrollable on small screens |
| Inputs | border-input bg-background, rounded, focus:border-primary focus:ring-primary |
| Errors | role=alert, text-destructive |
| Loading | role=status; disable repeated actions while loading or saving |

Pattern notes: Reuse the 80 mm invoice preview for history printing. Keep saved unit prices on existing invoice lines. Editing reconciles inventory deltas and derived payment balances; deletion requires an explicit confirmation and restores stock. Keep controls outside the print document. Search remains intact after editing or deleting.

## Activity log

Files: src/app/admin/activity-log/page.tsx, src/lib/activity-log.ts
Last updated: 2026-09-30

| Property | Classes / pattern |
| --- | --- |
| Table and filter surface | rounded border border-border bg-card |
| Table headings | bg-primary-tint, label-caps, text-muted-foreground, px-4 py-3 |
| Cell text | text-sm; data-mono for timestamps and record references |
| Search controls | border-input bg-background, rounded, focus:border-primary focus:ring-primary |
| Pagination | bordered links, visible focus outline; inactive directions use aria-disabled |
| Empty state | existing History icon, centered text, bordered card |

Pattern notes: Read-only Admin/Supervisor log across gym locations; require ADMIN, not SUPERADMIN. Sort newest first, 25 entries per page. Search, action, and gym filters persist in URL. Show Pakistan time and human-readable actions. New memberships, renewals, invoice creation/edits/deletions, expenses, inventory, suppliers, purchases, payment methods, transfers, packages, and extras write activity atomically. Summarize only intentional metadata fields rather than rendering arbitrary stored JSON. Older unlogged actions are not fabricated.
