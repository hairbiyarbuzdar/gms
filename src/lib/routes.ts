import type { Role } from "@/generated/prisma/enums";

/** The login screen. Unauthenticated visitors land here. */
export const LOGIN_ROUTE = "/login";

/**
 * Where each role belongs after signing in. A user is never shown a shell they
 * have no rights in: the superadmin owns the control plane, the admin gets the
 * read-only supervisory view, and a tenant account goes to its own location.
 */
export const ROLE_HOME: Record<Role, string> = {
  SUPERADMIN: "/superadmin",
  ADMIN: "/admin",
  TENANT: "/app",
};

export function homeForRole(role: Role): string {
  return ROLE_HOME[role];
}
