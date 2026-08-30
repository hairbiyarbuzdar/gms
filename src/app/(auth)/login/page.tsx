import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only same-origin paths survive; an absolute URL here would be an open
  // redirect after sign-in.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-8 md:px-8">
      <div className="flex w-full max-w-[420px] flex-col gap-8 rounded-lg border border-border bg-card p-6 sm:p-8">
        <header className="flex flex-col items-center text-center">
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Dumbbell className="size-8" aria-hidden="true" />
            <h1 className="text-2xl font-bold uppercase tracking-tight">Iron Reserve</h1>
          </div>
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            Secure administrative access
          </p>
        </header>

        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
