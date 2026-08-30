import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LOGIN_ROUTE, homeForRole } from "@/lib/routes";

/**
 * "/" is a router, never a destination. Middleware already sends
 * unauthenticated traffic to the login screen; this handles a signed-in user
 * landing here and forwards them to the home for their role.
 */
export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(LOGIN_ROUTE);
  }

  redirect(homeForRole(session.user.role));
}
