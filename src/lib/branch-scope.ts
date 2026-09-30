export const BRANCH_HEADER = "x-admin-branch";

export function branchFromPath(pathname: string) {
  const match = pathname.match(/^\/admin\/branches\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  return match ? { id: match[1], path: "/app" + (match[2] ?? "") } : null;
}

export function scopedHeaders(incoming: Headers, pathname: string, role: string) {
  const headers = new Headers(incoming);
  headers.delete(BRANCH_HEADER);
  const branch = branchFromPath(pathname);
  if (role === "ADMIN" && branch) headers.set(BRANCH_HEADER, branch.id);
  return headers;
}

export function resolveBranchId(
  role: string,
  assigned: string | null | undefined,
  adminBranch: string | null
) {
  if (role === "TENANT") return assigned || null;
  if (role === "ADMIN") return adminBranch || null;
  return null;
}
