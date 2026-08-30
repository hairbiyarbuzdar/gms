"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Lock, Mail, TriangleAlert } from "lucide-react";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#570000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in…" : "Sign In"}
      {!pending && <ArrowRight className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] leading-[18px] text-destructive"
        >
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor="email" className="label-caps mb-1 text-muted-foreground">
          Email Address
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            placeholder="you@example.com"
            className="w-full rounded border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive"
          />
        </div>
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-[13px] leading-[18px] text-destructive">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="label-caps mb-1 text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            placeholder="Enter your password"
            className="w-full rounded border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-destructive"
          />
        </div>
        {state.fieldErrors?.password && (
          <p id="password-error" className="mt-1 text-[13px] leading-[18px] text-destructive">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
