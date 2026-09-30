import Link from "next/link";
import { WorkspaceProvider } from "@/components/workspace-link";
import { getTenantContext } from "@/lib/tenant-context";
import { TenantNav } from "@/components/tenant-nav";
import { AppFooter } from "@/components/app-footer";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Shell for the whole tenant portal.
 *
 * Resolving the tenant context here means every route under /app is guarded:
 * tenant users stay in their own branch, and Admin uses a branch workspace.
 * Deleted or suspended branches are refused. Pages still call
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
  const { tenantId, tenantName, userEmail, adminBranch } = await getTenantContext();

  return (
    <WorkspaceProvider value={adminBranch ? `/admin/branches/${tenantId}` : "/app"}>
      <div className="flex min-h-svh flex-col">
        <TenantNav tenantName={tenantName} userEmail={userEmail} signOut={<SignOutButton />} />

        {adminBranch && (
          <div className="border-border bg-primary/5 border-b px-4 py-3 text-sm">
            <div className="mx-auto flex max-w-[1376px] flex-wrap justify-between gap-2">
              <strong>Admin · Branch: {tenantName}</strong>
              <Link href="/admin" className="text-primary underline">
                All branches / switch branch
              </Link>
            </div>
          </div>
        )}
        <div className="flex-1">{children}</div>

        <AppFooter />
      </div>
    </WorkspaceProvider>
  );
}
