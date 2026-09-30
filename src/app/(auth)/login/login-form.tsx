"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, TriangleAlert } from "lucide-react";
import { login, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-card mt-2 flex w-full items-center justify-center gap-2 rounded py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in…" : "Sign In"}
      {!pending && <ArrowRight className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded border px-3 py-2.5 text-[13px] leading-[18px]"
        >
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor="email" className="label-caps text-muted-foreground mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail
            className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
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
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary aria-invalid:border-destructive w-full rounded border py-2.5 pr-4 pl-10 text-sm transition-colors outline-none focus:ring-1"
          />
        </div>
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-destructive mt-1 text-[13px] leading-[18px]">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="label-caps text-muted-foreground mb-1">
          Password
        </label>
        <div className="relative">
          <Lock
            className="text-muted-foreground/60 pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            placeholder="Enter your password"
            className="border-input bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary aria-invalid:border-destructive w-full rounded border py-2.5 pr-12 pl-10 text-sm transition-colors outline-none focus:ring-1"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            title={showPassword ? "Hide password" : "Show password"}
            className="text-muted-foreground hover:text-primary focus-visible:outline-primary absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded focus-visible:outline-2"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-destructive mt-1 text-[13px] leading-[18px]">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
