import { Table2 } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";
import { PageHeader } from "@/components/page-header";
import { ModulePlaceholder } from "@/components/module-placeholder";

export const metadata = { title: "Data Viewer" };

export default async function DataViewerPage() {
  await getTenantContext();

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Tools"
        title="Data Viewer"
        description="Search and export raw records."
      />
      <ModulePlaceholder icon={Table2} requirements="FR-49 - FR-50" />
    </main>
  );
}
