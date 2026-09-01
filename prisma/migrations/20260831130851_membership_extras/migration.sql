-- Paid add-ons a member can take alongside their package.

CREATE TABLE "Extra" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fee" DECIMAL(12,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Extra_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Extra_tenantId_name_key" ON "Extra"("tenantId", "name");
CREATE INDEX "Extra_tenantId_isActive_idx" ON "Extra"("tenantId", "isActive");

ALTER TABLE "Extra"
  ADD CONSTRAINT "Extra_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MembershipExtra" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "extraId" TEXT NOT NULL,
  "fee" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembershipExtra_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipExtra_membershipId_extraId_key"
  ON "MembershipExtra"("membershipId", "extraId");
CREATE INDEX "MembershipExtra_tenantId_idx" ON "MembershipExtra"("tenantId");

ALTER TABLE "MembershipExtra"
  ADD CONSTRAINT "MembershipExtra_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipExtra"
  ADD CONSTRAINT "MembershipExtra_extraId_fkey"
  FOREIGN KEY ("extraId") REFERENCES "Extra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
