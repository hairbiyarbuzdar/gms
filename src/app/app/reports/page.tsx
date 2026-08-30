import { TrendingUp } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";
import { PageHeader } from "@/components/page-header";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await getTenantContext();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Analysis"
        title="Reports"
        description="Membership, sales, inventory, purchases, expenses, and cash."
      />
      <ModulePlaceholder icon={TrendingUp} requirements="FR-42 - FR-48" />
    </main>
  );
}
