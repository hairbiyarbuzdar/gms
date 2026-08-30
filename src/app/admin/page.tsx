import { requireRole } from "@/lib/guards";
import { PlatformShell } from "@/components/platform-shell";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");

  return (
    <PlatformShell role="Supervisor" userEmail={user.email ?? ""} home="/admin">
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
        <header className="border-b border-border pb-4">
          <p className="label-caps text-muted-foreground">Supervisor</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">All Locations</h1>
        </header>

        <p className="mt-6 text-sm text-muted-foreground">
          The read-only overview is not built yet.
        </p>
      </main>
    </PlatformShell>
  );
}
