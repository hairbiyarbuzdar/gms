import { Truck } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";
import { PageHeader } from "@/components/page-header";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  await getTenantContext();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Purchasing"
        title="Suppliers"
        description="Suppliers and purchase invoices."
      />
      <ModulePlaceholder icon={Truck} requirements="FR-32 - FR-35" />
    </main>
  );
}
