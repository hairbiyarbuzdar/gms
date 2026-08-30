"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validators/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      },
    };
  }

  const next = formData.get("next");
  const destination =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  try {
    // redirect: false keeps control here, so signIn never throws the redirect
    // error that would otherwise have to be re-thrown past the catch.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately identical for a wrong password, an unknown email, a
      // disabled account and a suspended location - none of it should be
      // discoverable from the login screen.
      return { error: "Incorrect email or password." };
    }

    throw error;
  }

  // Outside the try: redirect() signals by throwing, and must not be caught.
  // Middleware routes "/" onward to the right home for this user's role.
  redirect(destination);
}
