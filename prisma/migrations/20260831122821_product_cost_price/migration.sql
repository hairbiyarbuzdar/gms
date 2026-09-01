-- Products gain a cost price. Purchase invoice lines carry a per-unit cost and
-- the sale price to apply when the invoice is posted (reverses decision D-8).

ALTER TABLE "Product"
  ADD COLUMN "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Replace the single lineAmount with unit cost + unit sale price.
-- Safe: no purchase invoice lines exist yet.
ALTER TABLE "PurchaseInvoiceLine" DROP COLUMN "lineAmount";
ALTER TABLE "PurchaseInvoiceLine"
  ADD COLUMN "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "unitSalePrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Drop the app-level defaults now that existing rows are covered.
ALTER TABLE "PurchaseInvoiceLine" ALTER COLUMN "unitCost" DROP DEFAULT;
ALTER TABLE "PurchaseInvoiceLine" ALTER COLUMN "unitSalePrice" DROP DEFAULT;
