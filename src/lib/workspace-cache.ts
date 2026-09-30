import { revalidatePath as invalidate } from "next/cache";
/** Branch workspaces reuse /app routes through a rewrite; invalidate both URL trees. */
export function revalidatePath(path: string, type?: "layout" | "page") {
  invalidate(path, type);
  invalidate("/admin", "layout");
}
