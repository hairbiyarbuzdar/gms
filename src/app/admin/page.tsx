import { requireRole } from "@/lib/guards";
import { PlatformShell } from "@/components/platform-shell";
import Link from "next/link";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");

  return (
    <PlatformShell role="Supervisor" userEmail={user.email ?? ""} home="/admin">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        <header className="border-border border-b pb-4">
          <p className="label-caps text-muted-foreground">Supervisor</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">All Locations</h1>
        </header>

        <section className="border-border bg-card mt-6 rounded border p-5">
          <h2 className="text-lg font-semibold">Activity across locations</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Review memberships, renewals, invoices, expenses, inventory, and other recorded actions.
          </p>
          <Link
            href="/admin/activity-log"
            className="bg-primary text-primary-foreground hover:bg-primary-hover mt-4 inline-block rounded px-4 py-2.5 text-sm"
          >
            View activity log
          </Link>
        </section>
      </main>
    </PlatformShell>
  );
}
