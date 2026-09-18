"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SUPABASE_SETUP_MESSAGE,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export type AuthState = { error?: string; notice?: string };

const MIN_PASSWORD_LENGTH = 8;

async function getOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Only allow relative paths, so ?next= can't be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: SUPABASE_SETUP_MESSAGE };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Please fill in every field." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Please use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || null },
      emailRedirectTo: `${await getOrigin()}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // With email confirmation enabled (the Supabase default) there is no
  // session yet — the account is only live once the link is clicked.
  if (!data.session) {
    return {
      notice:
        "Almost there. We've sent a confirmation link to your email — open it to finish joining.",
    };
  }

  redirect("/home");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: SUPABASE_SETUP_MESSAGE };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately not distinguishing "no such account" from "wrong password" —
  // that difference tells an attacker which emails are registered.
  if (error) return { error: "That email and password don't match." };

  redirect(next);
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
