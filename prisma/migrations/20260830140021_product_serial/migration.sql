-- Sequential per-tenant serial number for products, starting at 1.

-- Added nullable first so existing rows can be backfilled before the
-- NOT NULL constraint applies.
ALTER TABLE "Product" ADD COLUMN "serial" INTEGER;

-- Number existing products per tenant in creation order.
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt", id) AS rn
  FROM "Product"
)
UPDATE "Product" p
SET "serial" = n.rn
FROM numbered n
WHERE p.id = n.id;

ALTER TABLE "Product" ALTER COLUMN "serial" SET NOT NULL;

CREATE UNIQUE INDEX "Product_tenantId_serial_key" ON "Product"("tenantId", "serial");
