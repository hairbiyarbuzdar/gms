import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { LOGIN_ROUTE } from "@/lib/routes";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: LOGIN_ROUTE });
      }}
    >
      <button
        type="submit"
        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}
