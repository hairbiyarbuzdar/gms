import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { LOGIN_ROUTE, homeForRole } from "@/lib/routes";

/**
 * Requires a signed-in user in one of the given roles.
 *
 * Middleware proves a session exists but does not enforce which shell a role
 * may enter, so every protected page and mutation calls this. A user in the
 * wrong place is sent to their own home rather than shown a denial - they have
 * somewhere legitimate to be.
 */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect(LOGIN_ROUTE);
  }

  if (!roles.includes(user.role)) {
    redirect(homeForRole(user.role));
  }

  return user;
}
