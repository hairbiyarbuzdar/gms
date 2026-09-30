import Link from "next/link";
import { requireRole } from "@/lib/guards";
import { db } from "@/lib/db";
import { PlatformShell } from "@/components/platform-shell";
import { getAdminDashboardStats } from "@/app/app/dashboard-data";
import { formatMoney } from "@/lib/format";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const [branches, stats] = await Promise.all([
    db.tenant.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        _count: { select: { members: true } },
      },
    }),
    getAdminDashboardStats(),
  ]);
  const cards = [
    ["Active memberships", stats.activeMembers],
    ["Renewals due this week", stats.renewalsDueThisWeek],
    ["Overdue renewals", stats.renewalsOverdue],
    ["Revenue today", formatMoney(stats.revenueToday)],
    ["Revenue this month", formatMoney(stats.revenueThisMonth)],
    ["Expenses this month", formatMoney(stats.expensesThisMonth)],
    ["Low stock products", stats.lowStockCount],
  ];
  return (
    <PlatformShell role="Admin" userEmail={user.email ?? ""} home="/admin">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        <h1 className="text-2xl font-semibold">All branches</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          View every branch from the modules above. Open a branch to create, edit, delete, or print
          its records.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <section key={label} className="border-border bg-card rounded border p-5">
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
            </section>
          ))}
        </div>
        <h2 className="mt-8 text-lg font-semibold">Branch workspaces</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <section key={branch.id} className="border-border bg-card rounded border p-5">
              <h3 className="font-semibold">{branch.name}</h3>
              <p className="text-muted-foreground text-sm">{branch.location}</p>
              <p className="my-3 text-sm">
                {branch._count.members} members �{" "}
                {branch.status === "ACTIVE" ? "Active" : "Suspended"}
              </p>
              {branch.status === "ACTIVE" ? (
                <Link
                  href={`/admin/branches/${branch.id}`}
                  className="text-primary text-sm font-medium underline"
                >
                  Open branch
                </Link>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Workspace unavailable while suspended
                </p>
              )}
            </section>
          ))}
        </div>
        {branches.length === 0 && (
          <p className="text-muted-foreground mt-4">No branches have been created yet.</p>
        )}
      </main>
    </PlatformShell>
  );
}
