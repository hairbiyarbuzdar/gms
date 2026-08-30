import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { AppFooter } from "@/components/app-footer";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Sticky shell for the platform surfaces (superadmin, admin).
 *
 * Same top-and-bottom sticky arrangement as the tenant portal, minus the
 * module nav - these surfaces are single-screen.
 */
export function PlatformShell({
  role,
  userEmail,
  home,
  children,
}: {
  role: string;
  userEmail: string;
  home: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center gap-6 px-4 md:px-8">
          <Link href={home} className="flex shrink-0 items-center gap-2 text-primary">
            <Dumbbell className="size-6" aria-hidden="true" />
            <span className="text-lg font-bold uppercase tracking-tight">Iron Reserve</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-medium leading-tight">{role}</p>
              <p className="max-w-[200px] truncate text-[12px] leading-tight text-muted-foreground">
                {userEmail}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <AppFooter />
    </div>
  );
}
