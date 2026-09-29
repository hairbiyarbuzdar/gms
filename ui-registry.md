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
