import { Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { PlatformShell } from "@/components/platform-shell";
import { CreateTenantDialog } from "./create-tenant-dialog";

const dateFormat = new Intl.DateTimeFormat("en-PK", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});

export default async function SuperadminPage() {
  const user = await requireRole("SUPERADMIN");

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
      createdAt: true,
      users: { select: { email: true }, take: 1 },
    },
  });

  return (
    <PlatformShell role="Superadmin" userEmail={user.email ?? ""} home="/superadmin">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="label-caps text-muted-foreground">Superadmin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tenants</h1>
          </div>
          <CreateTenantDialog />
        </header>

        {tenants.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
            <Building2 className="size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">No tenants yet</p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
              Create one to provision its management system.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="label-caps px-4 py-3 text-muted-foreground">Name</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Location</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Login</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Status</th>
                  <th className="label-caps px-4 py-3 text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm font-medium">{tenant.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tenant.location}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {tenant.users[0]?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {tenant.status}
                      </span>
                    </td>
                    <td className="data-mono px-4 py-3 text-muted-foreground">
                      {dateFormat.format(tenant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </PlatformShell>
  );
}
