import { getTenantContext } from "@/lib/tenant-context";
import { TenantNav } from "@/components/tenant-nav";
import { AppFooter } from "@/components/app-footer";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Shell for the whole tenant portal.
 *
 * Resolving the tenant context here means every route under /app is guarded:
 * a non-TENANT user, a user whose tenant was deleted, or one whose location
 * was suspended is redirected before any child page renders. Pages still call
 * getTenantContext() themselves to get the tenantId - it is request-cached, so
 * that costs nothing.
 *
 * The nav and footer are sticky. That relies on the document being the
 * scroller, so nothing here may introduce its own overflow container - a
 * nested scroll area would leave both bars pinned to a box the user isn't
 * scrolling.
 *
 * SignOutButton is a server component (it wraps a server action), so it is
 * passed into the client nav as a prop rather than imported there.
 */
export default async function TenantLayout({ children }: LayoutProps<"/app">) {
  const { tenantName, userEmail } = await getTenantContext();

  return (
    <div className="flex min-h-svh flex-col">
      <TenantNav
        tenantName={tenantName}
        userEmail={userEmail}
        signOut={<SignOutButton />}
      />

      <div className="flex-1">{children}</div>

      <AppFooter />
    </div>
  );
}
