import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guards";

export default async function ActivityLogRedirect() {
  await requireRole("ADMIN");
  redirect("/admin/activity-log");
}
