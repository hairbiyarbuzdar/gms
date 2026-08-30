-- Opening balance per payment method, and transfers between methods.

ALTER TABLE "PaymentMethod"
  ADD COLUMN "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TABLE "PaymentTransfer" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "fromMethodId" TEXT NOT NULL,
  "toMethodId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "note" TEXT,
  "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransfer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentTransfer_tenantId_transferredAt_idx"
  ON "PaymentTransfer"("tenantId", "transferredAt");
CREATE INDEX "PaymentTransfer_fromMethodId_idx" ON "PaymentTransfer"("fromMethodId");
CREATE INDEX "PaymentTransfer_toMethodId_idx" ON "PaymentTransfer"("toMethodId");

ALTER TABLE "PaymentTransfer"
  ADD CONSTRAINT "PaymentTransfer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentTransfer"
  ADD CONSTRAINT "PaymentTransfer_fromMethodId_fkey"
  FOREIGN KEY ("fromMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentTransfer"
  ADD CONSTRAINT "PaymentTransfer_toMethodId_fkey"
  FOREIGN KEY ("toMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
