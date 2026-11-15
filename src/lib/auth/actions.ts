"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "./errors";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
} from "./validation";

export type AuthResult = { ok: true } | { ok: false; error: string };

function invalidFields(issues: { message: string }[]): AuthResult {
  return { ok: false, error: issues[0]?.message ?? "Champs invalides." };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return invalidFields(parsed.error.issues);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  redirect(safeRedirectPath(formData.get("redirectTo")));
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return invalidFields(parsed.error.issues);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return invalidFields(parsed.error.issues);
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ?? `http://${requestHeaders.get("host") ?? "localhost:3000"}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return invalidFields(parsed.error.issues);
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { ok: false, error: "Lien de réinitialisation invalide ou expiré." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  redirect("/");
}
