import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { LOGIN_ROUTE } from "@/lib/routes";

export type TenantContext = {
  tenantId: string;
  tenantName: string;
  tenantLocation: string;
  userId: string;
  userEmail: string;
};

/**
 * Resolves the current tenant for a request.
 *
 * The tenant comes from the signed-in user's own record and from nowhere else -
 * never a route param, query string, header, or form field. That is the whole
 * isolation guarantee under the shared-schema model: a tenant user physically
 * cannot address another tenant's data, because there is no input that would
 * let them name one.
 *
 * Cached per request so a page and its components resolve it once.
 */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const user = await requireRole("TENANT");

  // A TENANT account without a tenantId is a data integrity failure - the
  // creation path always sets it. Refuse rather than fall back to anything.
  if (!user.tenantId) {
    redirect(LOGIN_ROUTE);
  }

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: { id: true, name: true, location: true, status: true },
  });

  // Deleted or suspended after the session was issued: the JWT is still valid
  // but the location is not open for business.
  if (!tenant || tenant.status !== "ACTIVE") {
    redirect(LOGIN_ROUTE);
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantLocation: tenant.location,
    userId: user.id,
    userEmail: user.email ?? "",
  };
});
